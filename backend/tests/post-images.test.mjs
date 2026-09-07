import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { test } from "node:test";

import cloudinary from "../src/config/cloudinary.ts";
import { createPost, deletePost, updatePost } from "../src/controllers/postController.ts";
import Post from "../src/models/posts.ts";

const POST_ID = "507f1f77bcf86cd799439011";
const OWNER_ID = "507f1f77bcf86cd799439012";
const OTHER_ID = "507f1f77bcf86cd799439013";
const OLD_IMAGE = { url: "https://images.example/old.jpg", publicId: "quora/posts/old" };
const NEW_IMAGE = { url: "https://images.example/new.jpg", publicId: "quora/posts/new" };
const FILE = { buffer: Buffer.from("mock image bytes") };

function fixture(t, options = {}) {
  const events = [];
  const destroyCalls = [];
  const failures = { ...options };
  let stored = options.missing ? null : {
    _id: POST_ID,
    author: options.author ?? OWNER_ID,
    content: "Original content",
    image: options.withoutImage ? undefined : structuredClone(OLD_IMAGE),
  };
  const assets = new Set(stored?.image?.publicId ? [stored.image.publicId] : []);

  // Keep every request local, independent of developer credentials or MongoDB.
  t.mock.method(console, "error", () => {});
  t.mock.method(cloudinary, "config", () => ({
    cloud_name: "test-cloud", api_key: "test-key", api_secret: "test-secret",
  }));
  t.mock.method(cloudinary.uploader, "upload_stream", (_options, callback) => {
    events.push("upload");
    const stream = new Writable({ write(_chunk, _encoding, done) { done(); } });
    stream.once("finish", () => {
      if (failures.uploadError) return callback(failures.uploadError);
      assets.add(NEW_IMAGE.publicId);
      callback(null, { secure_url: NEW_IMAGE.url, public_id: NEW_IMAGE.publicId });
    });
    return stream;
  });
  t.mock.method(cloudinary.uploader, "destroy", async (publicId, destroyOptions) => {
    events.push(`destroy:${publicId}`);
    destroyCalls.push({ publicId, options: destroyOptions });
    if (failures.destroyError) throw failures.destroyError;
    if (failures.destroyResult) return { result: failures.destroyResult };
    return { result: assets.delete(publicId) ? "ok" : "not found" };
  });

  function document(data) {
    return {
      ...structuredClone(data),
      async save() {
        events.push("save");
        if (failures.saveError) throw failures.saveError;
        stored = structuredClone({
          _id: this._id, author: this.author, content: this.content, image: this.image,
        });
        return this;
      },
      async populate(path, fields) {
        events.push("populate");
        assert.equal(path, "author");
        assert.equal(fields, "username");
        if (failures.populateError) throw failures.populateError;
        this.author = { _id: this.author, username: "test-author" };
        return this;
      },
    };
  }

  t.mock.method(Post, "findById", async () => {
    events.push("find");
    return stored ? document(stored) : null;
  });
  t.mock.method(Post, "create", async (data) => {
    events.push("create");
    if (failures.createError) throw failures.createError;
    stored = { _id: POST_ID, ...structuredClone(data) };
    return document(stored);
  });
  t.mock.method(Post, "findByIdAndDelete", async () => {
    events.push("delete");
    if (failures.deleteError) throw failures.deleteError;
    const previous = stored;
    stored = null;
    return previous;
  });

  return {
    events, assets, failures, destroyCalls,
    stored: () => structuredClone(stored),
    async request(controller, overrides = {}) {
      const req = {
        params: { id: POST_ID }, user: { _id: OWNER_ID },
        body: { content: "  Edited content  " }, ...overrides,
      };
      const res = {
        statusCode: 200, body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
      };
      await controller(req, res);
      return res;
    },
  };
}

test("text edits preserve the existing image and return the populated author", async (t) => {
  const f = fixture(t);
  const res = await f.request(updatePost);
  assert.equal(res.statusCode, 200);
  assert.equal(f.stored().content, "Edited content");
  assert.deepEqual(f.stored().image, OLD_IMAGE);
  assert.deepEqual(res.body.post.image, OLD_IMAGE);
  assert.deepEqual(res.body.post.author, { _id: OWNER_ID, username: "test-author" });
  assert.deepEqual(f.events, ["find", "save", "populate"]);
});

test("adding an image uploads it and saves its URL and public ID", async (t) => {
  const f = fixture(t, { withoutImage: true });
  const res = await f.request(updatePost, { file: FILE });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.stored().image, NEW_IMAGE);
  assert.deepEqual(res.body.post.image, NEW_IMAGE);
  assert.deepEqual(f.events, ["find", "upload", "save", "populate"]);
});

test("replacement saves the new image before destroying the previous image", async (t) => {
  const f = fixture(t);
  const res = await f.request(updatePost, { file: FILE });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(f.stored().image, NEW_IMAGE);
  assert.deepEqual(res.body.post.image, NEW_IMAGE);
  assert.deepEqual([...f.assets], [NEW_IMAGE.publicId]);
  assert.deepEqual(f.events, ["find", "upload", "save", `destroy:${OLD_IMAGE.publicId}`, "populate"]);
});

for (const removeImage of [true, "true"]) {
  test(`image removal accepts ${JSON.stringify(removeImage)} and clears storage after saving`, async (t) => {
    const f = fixture(t);
    const res = await f.request(updatePost, { body: { content: "Edited", removeImage } });
    assert.equal(res.statusCode, 200);
    assert.equal(f.stored().image, undefined);
    assert.equal(res.body.post.image, undefined);
    assert.equal(f.assets.size, 0);
    assert.deepEqual(f.events, ["find", "save", `destroy:${OLD_IMAGE.publicId}`, "populate"]);
  });
}

for (const removeImage of [false, "false"]) {
  test(`removeImage=${JSON.stringify(removeImage)} preserves the current image`, async (t) => {
    const f = fixture(t);
    const res = await f.request(updatePost, { body: { content: "Edited", removeImage } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(f.stored().image, OLD_IMAGE);
    assert.deepEqual(f.events, ["find", "save", "populate"]);
  });
}

for (const [name, overrides] of [
  ["invalid ID", { params: { id: "invalid" }, file: FILE }],
  ["blank content", { body: { content: "   " }, file: FILE }],
  ["non-string content", { body: { content: {} }, file: FILE }],
  ["invalid removal flag", { body: { content: "Edited", removeImage: "yes" }, file: FILE }],
  ["replacement and removal together", { body: { content: "Edited", removeImage: "true" }, file: FILE }],
]) {
  test(`edit rejects ${name} before changing images or the stored post`, async (t) => {
    const f = fixture(t);
    const before = f.stored();
    const res = await f.request(updatePost, overrides);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(f.stored(), before);
    assert.deepEqual([...f.assets], [OLD_IMAGE.publicId]);
    assert.ok(f.events.every((event) => event === "find"));
  });
}

for (const controller of [updatePost, deletePost]) {
  test(`${controller.name} rejects non-owners before touching media`, async (t) => {
    const f = fixture(t, { author: OTHER_ID });
    const before = f.stored();
    const res = await f.request(controller, { file: FILE });
    assert.equal(res.statusCode, 403);
    assert.deepEqual(f.stored(), before);
    assert.deepEqual(f.events, ["find"]);
  });

  test(`${controller.name} returns 404 for a missing post without touching media`, async (t) => {
    const f = fixture(t, { missing: true });
    const res = await f.request(controller, { file: FILE });
    assert.equal(res.statusCode, 404);
    assert.deepEqual(f.events, ["find"]);
  });
}

test("a failed replacement upload leaves the previous post and image intact", async (t) => {
  const f = fixture(t, { uploadError: { http_code: 400 } });
  const before = f.stored();
  const res = await f.request(updatePost, { file: FILE });
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, "IMAGE_UPLOAD_REJECTED");
  assert.deepEqual(f.stored(), before);
  assert.deepEqual([...f.assets], [OLD_IMAGE.publicId]);
  assert.deepEqual(f.events, ["find", "upload"]);
});

test("failed replacement save destroys only the unsaved upload", async (t) => {
  const f = fixture(t, { saveError: new Error("DB unavailable") });
  const before = f.stored();
  const res = await f.request(updatePost, { file: FILE });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(f.stored(), before);
  assert.deepEqual([...f.assets], [OLD_IMAGE.publicId]);
  assert.deepEqual(f.events, ["find", "upload", "save", `destroy:${NEW_IMAGE.publicId}`]);
});

test("failed removal save leaves the existing image intact", async (t) => {
  const f = fixture(t, { saveError: new Error("DB unavailable") });
  const res = await f.request(updatePost, { body: { content: "Edited", removeImage: true } });
  assert.equal(res.statusCode, 500);
  assert.deepEqual(f.stored().image, OLD_IMAGE);
  assert.deepEqual([...f.assets], [OLD_IMAGE.publicId]);
  assert.deepEqual(f.events, ["find", "save"]);
});

test("cleanup failure after a saved edit returns success with a warning", async (t) => {
  const f = fixture(t, { destroyError: new Error("Cloudinary unavailable") });
  const res = await f.request(updatePost, { file: FILE });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.warning, /previous image/);
  assert.deepEqual(f.stored().image, NEW_IMAGE);
  assert.deepEqual(res.body.post.image, NEW_IMAGE);
  assert.deepEqual([...f.assets], [OLD_IMAGE.publicId, NEW_IMAGE.publicId]);
});

test("cleanup failure after a failed save still reports the save failure", async (t) => {
  const f = fixture(t, {
    saveError: new Error("DB unavailable"), destroyError: new Error("Cloudinary unavailable"),
  });
  const res = await f.request(updatePost, { file: FILE });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.deepEqual(f.stored().image, OLD_IMAGE);
  assert.deepEqual(f.destroyCalls.map((call) => call.publicId), [NEW_IMAGE.publicId]);
});

for (const controller of [createPost, updatePost]) {
  test(`${controller.name} never deletes a saved image if author population fails`, async (t) => {
    const f = fixture(t, { withoutImage: true, populateError: new Error("Population failed") });
    const res = await f.request(controller, { file: FILE });
    assert.equal(res.statusCode, 500);
    assert.deepEqual(f.stored().image, NEW_IMAGE);
    assert.ok(f.assets.has(NEW_IMAGE.publicId));
    assert.deepEqual(f.destroyCalls, []);
  });
}

test("create returns a populated post containing the uploaded image", async (t) => {
  const f = fixture(t, { missing: true });
  const res = await f.request(createPost, { file: FILE });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(f.stored().image, NEW_IMAGE);
  assert.deepEqual(res.body.post.author, { _id: OWNER_ID, username: "test-author" });
  assert.deepEqual(f.events, ["upload", "create", "populate"]);
});

test("failed post creation cleans up its uploaded image", async (t) => {
  const f = fixture(t, { missing: true, createError: new Error("DB unavailable") });
  const res = await f.request(createPost, { file: FILE });
  assert.equal(res.statusCode, 500);
  assert.equal(f.stored(), null);
  assert.equal(f.assets.size, 0);
  assert.deepEqual(f.events, ["upload", "create", `destroy:${NEW_IMAGE.publicId}`]);
});

test("post deletion destroys its image before deleting the database record", async (t) => {
  const f = fixture(t);
  const res = await f.request(deletePost);
  assert.equal(res.statusCode, 200);
  assert.equal(f.stored(), null);
  assert.equal(f.assets.size, 0);
  assert.deepEqual(f.events, ["find", `destroy:${OLD_IMAGE.publicId}`, "delete"]);
  assert.deepEqual(f.destroyCalls, [{
    publicId: OLD_IMAGE.publicId, options: { resource_type: "image", invalidate: true },
  }]);
});

test("Cloudinary deletion failure retains the post for retry", async (t) => {
  const f = fixture(t, { destroyError: new Error("Cloudinary unavailable") });
  const before = f.stored();
  const res = await f.request(deletePost);
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, "IMAGE_DELETE_FAILED");
  assert.deepEqual(f.stored(), before);
  assert.ok(f.assets.has(OLD_IMAGE.publicId));
  assert.deepEqual(f.events, ["find", `destroy:${OLD_IMAGE.publicId}`]);
});

test("unexpected Cloudinary deletion results do not delete the post", async (t) => {
  const f = fixture(t, { destroyResult: "error" });
  const res = await f.request(deletePost);
  assert.equal(res.statusCode, 502);
  assert.ok(f.stored());
  assert.ok(f.assets.has(OLD_IMAGE.publicId));
  assert.deepEqual(f.events, ["find", `destroy:${OLD_IMAGE.publicId}`]);
});

test("database deletion can be retried when Cloudinary reports the image is already gone", async (t) => {
  const f = fixture(t, { deleteError: new Error("DB unavailable") });
  const failed = await f.request(deletePost);
  assert.equal(failed.statusCode, 500);
  assert.ok(f.stored());
  assert.equal(f.assets.size, 0);

  f.failures.deleteError = undefined;
  const retried = await f.request(deletePost);
  assert.equal(retried.statusCode, 200);
  assert.equal(f.stored(), null);
  assert.deepEqual(f.events, [
    "find", `destroy:${OLD_IMAGE.publicId}`, "delete",
    "find", `destroy:${OLD_IMAGE.publicId}`, "delete",
  ]);
});

test("posts without images delete without contacting Cloudinary", async (t) => {
  const f = fixture(t, { withoutImage: true });
  const res = await f.request(deletePost);
  assert.equal(res.statusCode, 200);
  assert.equal(f.stored(), null);
  assert.deepEqual(f.events, ["find", "delete"]);
});
