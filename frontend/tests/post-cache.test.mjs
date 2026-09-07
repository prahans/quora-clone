import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import axios from "axios";
import { MutationObserver, QueryObserver } from "@tanstack/react-query";
import { createServer } from "vite";

let server;
let api;
let createQueryClient;
let advanceSessionVersion;
let postKeys;
let postsQueryOptions;
let postQueryOptions;
let createPostMutationOptions;
let updatePostMutationOptions;
let deletePostMutationOptions;
const clients = [];
const subscriptions = [];

const firstPost = {
  _id: "post-1",
  author: { _id: "user-1", username: "reader" },
  content: "Original post",
};
const secondPost = { ...firstPost, _id: "post-2", content: "Another post" };

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    configFile: false,
    envFile: false,
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true, watch: null },
  });
  ({ api } = await server.ssrLoadModule("/src/api.ts"));
  ({ createQueryClient, advanceSessionVersion } = await server.ssrLoadModule("/src/queryClient.ts"));
  ({ postKeys, postsQueryOptions, postQueryOptions } =
    await server.ssrLoadModule("/src/queries/postQueries.ts"));
  ({ createPostMutationOptions, updatePostMutationOptions, deletePostMutationOptions } =
    await server.ssrLoadModule("/src/queries/postMutations.ts"));
});

afterEach(() => {
  for (const unsubscribe of subscriptions.splice(0)) unsubscribe();
  for (const client of clients.splice(0)) client.clear();
  api.defaults.adapter = () => Promise.reject(new Error("Unexpected HTTP request"));
});

after(async () => {
  await server?.close();
});

function clientForTest() {
  const client = createQueryClient();
  clients.push(client);
  return client;
}

function response(config, data) {
  return { data, status: 200, statusText: "OK", headers: {}, config };
}

function mockRequests(handler) {
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push({ method: config.method, url: config.url });
    return response(config, await handler(config));
  };
  return requests;
}

function mountQuery(client, options) {
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  subscriptions.push(unsubscribe);
  return { observer, unmount: unsubscribe };
}

async function settled(observer) {
  const current = observer.getCurrentResult();
  if (current.fetchStatus === "idle" && current.status === "success") return current.data;
  if (current.fetchStatus === "idle" && current.status === "error") throw current.error;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error("Query did not settle within 2 seconds"));
    }, 2000);
    const unsubscribe = observer.subscribe((result) => {
      if (result.fetchStatus !== "idle" || result.status === "pending") return;
      clearTimeout(timer);
      unsubscribe();
      if (result.status === "error") reject(result.error);
      else resolve(result.data);
    });
  });
}

function mutate(client, options, variables) {
  return new MutationObserver(client, options).mutate(variables);
}

test("feed, details, edit, and returning to the feed reuse fresh cached posts", async () => {
  const client = clientForTest();
  const requests = mockRequests(() => [firstPost, secondPost]);
  const feed = mountQuery(client, postsQueryOptions());
  assert.deepEqual(await settled(feed.observer), [firstPost, secondPost]);
  const feedUpdatedAt = client.getQueryState(postKeys.list).dataUpdatedAt;
  feed.unmount();

  const details = mountQuery(client, postQueryOptions(client, firstPost._id));
  assert.deepEqual(await settled(details.observer), firstPost);
  assert.equal(client.getQueryState(postKeys.detail(firstPost._id)).dataUpdatedAt, feedUpdatedAt);
  details.unmount();

  const edit = mountQuery(client, postQueryOptions(client, firstPost._id));
  assert.deepEqual(await settled(edit.observer), firstPost);
  edit.unmount();

  const returningFeed = mountQuery(client, postsQueryOptions());
  assert.deepEqual(await settled(returningFeed.observer), [firstPost, secondPost]);
  assert.deepEqual(requests, [{ method: "get", url: "/api/posts" }]);
});

test("a direct detail visit fetches once and a later edit visit reuses it", async () => {
  const client = clientForTest();
  const requests = mockRequests(() => firstPost);
  const details = mountQuery(client, postQueryOptions(client, firstPost._id));
  assert.deepEqual(await settled(details.observer), firstPost);
  details.unmount();

  const edit = mountQuery(client, postQueryOptions(client, firstPost._id));
  assert.deepEqual(await settled(edit.observer), firstPost);
  assert.equal(client.getQueryData(postKeys.list), undefined);
  assert.deepEqual(requests, [{ method: "get", url: "/api/posts/post-1" }]);
});

test("stale feed data remains visible while a mounted feed refreshes it", async () => {
  const client = clientForTest();
  client.setQueryData(postKeys.list, [firstPost], { updatedAt: Date.now() - 6 * 60 * 1000 });
  const updatedPost = { ...firstPost, content: "Updated on another device" };
  const requests = mockRequests(() => [updatedPost]);

  const feed = mountQuery(client, postsQueryOptions());
  assert.deepEqual(feed.observer.getCurrentResult().data, [firstPost]);
  assert.equal(feed.observer.getCurrentResult().isFetching, true);
  assert.deepEqual(await settled(feed.observer), [updatedPost]);
  assert.deepEqual(requests, [{ method: "get", url: "/api/posts" }]);
});

test("details seeded from an old feed preserve its age and refresh", async () => {
  const client = clientForTest();
  const oldTimestamp = Date.now() - 6 * 60 * 1000;
  client.setQueryData(postKeys.list, [firstPost], { updatedAt: oldTimestamp });
  const updatedPost = { ...firstPost, content: "Latest detail" };
  const requests = mockRequests(() => updatedPost);

  const details = mountQuery(client, postQueryOptions(client, firstPost._id));
  assert.deepEqual(details.observer.getCurrentResult().data, firstPost);
  assert.equal(details.observer.getCurrentResult().dataUpdatedAt, oldTimestamp);
  assert.deepEqual(await settled(details.observer), updatedPost);
  assert.deepEqual(requests, [{ method: "get", url: "/api/posts/post-1" }]);
});

test("create, edit, and delete update cached pages from responses without extra GETs", async () => {
  const client = clientForTest();
  const createdPost = { ...firstPost, _id: "post-3", content: "Created post" };
  const updatedPost = { ...firstPost, content: "Saved by server" };
  const requests = mockRequests((config) => {
    if (config.method === "get") return [firstPost, secondPost];
    if (config.method === "post") {
      assert.ok(config.data instanceof FormData);
      assert.equal(config.data.get("content"), "Created post");
      return { post: createdPost };
    }
    if (config.method === "put") {
      assert.deepEqual(JSON.parse(config.data), { content: "Edited draft" });
      return { post: updatedPost };
    }
    if (config.method === "delete") return undefined;
    throw new Error(`Unexpected method: ${config.method}`);
  });
  const feed = mountQuery(client, postsQueryOptions());
  await settled(feed.observer);
  const listUpdatedAt = client.getQueryState(postKeys.list).dataUpdatedAt;

  await mutate(client, createPostMutationOptions(client), { content: "Created post" });
  assert.deepEqual(feed.observer.getCurrentResult().data, [firstPost, secondPost, createdPost]);
  assert.deepEqual(client.getQueryData(postKeys.detail(createdPost._id)), createdPost);

  const details = mountQuery(client, postQueryOptions(client, firstPost._id));
  await settled(details.observer);
  await mutate(client, updatePostMutationOptions(client), { id: firstPost._id, content: "Edited draft" });
  assert.deepEqual(feed.observer.getCurrentResult().data, [updatedPost, secondPost, createdPost]);
  assert.deepEqual(details.observer.getCurrentResult().data, updatedPost);
  details.unmount();

  await mutate(client, deletePostMutationOptions(client), firstPost._id);
  assert.deepEqual(feed.observer.getCurrentResult().data, [secondPost, createdPost]);
  assert.equal(client.getQueryState(postKeys.detail(firstPost._id)), undefined);
  assert.equal(client.getQueryState(postKeys.list).dataUpdatedAt, listUpdatedAt);
  assert.deepEqual(requests, [
    { method: "get", url: "/api/posts" },
    { method: "post", url: "/api/posts" },
    { method: "put", url: "/api/posts/post-1" },
    { method: "delete", url: "/api/posts/post-1" },
  ]);
});

test("image-only edits send multipart files and update the feed and detail image", async () => {
  const client = clientForTest();
  const original = {
    ...firstPost,
    image: { url: "https://example.com/old.jpg", publicId: "posts/old" },
  };
  const savedPost = {
    ...original,
    image: { url: "https://example.com/new.png", publicId: "posts/new" },
  };
  const image = new File(["image bytes"], "replacement.png", { type: "image/png" });
  client.setQueryData(postKeys.list, [original, secondPost]);
  client.setQueryData(postKeys.detail(original._id), original);
  mockRequests((config) => {
    assert.equal(config.method, "put");
    assert.ok(config.data instanceof FormData);
    assert.equal(config.data.get("content"), original.content);
    assert.equal(config.data.get("image"), image);
    assert.equal(config.data.has("removeImage"), false);
    return { post: savedPost };
  });

  const result = await mutate(client, updatePostMutationOptions(client), {
    id: original._id,
    content: original.content,
    image,
  });

  assert.deepEqual(result, { post: savedPost });
  assert.deepEqual(client.getQueryData(postKeys.list), [savedPost, secondPost]);
  assert.deepEqual(client.getQueryData(postKeys.detail(original._id)), savedPost);
});

test("image removal sends an explicit flag and preserves cleanup warnings with the saved post", async () => {
  const client = clientForTest();
  const original = {
    ...firstPost,
    image: { url: "https://example.com/old.jpg", publicId: "posts/old" },
  };
  const warning = "Post updated, but the previous image could not be removed from image storage.";
  client.setQueryData(postKeys.list, [original]);
  client.setQueryData(postKeys.detail(original._id), original);
  mockRequests((config) => {
    assert.equal(config.method, "put");
    assert.deepEqual(JSON.parse(config.data), { content: original.content, removeImage: true });
    return { post: firstPost, warning };
  });

  const result = await mutate(client, updatePostMutationOptions(client), {
    id: original._id,
    content: original.content,
    removeImage: true,
  });

  assert.equal(result.warning, warning);
  assert.deepEqual(client.getQueryData(postKeys.list), [firstPost]);
  assert.deepEqual(client.getQueryData(postKeys.detail(original._id)), firstPost);
});

test("mutating before visiting the feed does not invent an incomplete cached list", async () => {
  const client = clientForTest();
  const savedPost = { ...firstPost, content: "Saved" };
  mockRequests(() => ({ post: savedPost }));

  await mutate(client, createPostMutationOptions(client), { content: firstPost.content });
  assert.equal(client.getQueryData(postKeys.list), undefined);
  assert.deepEqual(client.getQueryData(postKeys.detail(firstPost._id)), savedPost);
  await mutate(client, updatePostMutationOptions(client), { id: firstPost._id, content: "Saved" });
  assert.equal(client.getQueryData(postKeys.list), undefined);
  await mutate(client, deletePostMutationOptions(client), firstPost._id);
  assert.equal(client.getQueryData(postKeys.list), undefined);
  assert.equal(client.getQueryData(postKeys.detail(firstPost._id)), undefined);
});

test("failed mutations leave cached posts and freshness unchanged", async () => {
  const client = clientForTest();
  const timestamp = Date.now() - 30_000;
  client.setQueryData(postKeys.list, [firstPost], { updatedAt: timestamp });
  client.setQueryData(postKeys.detail(firstPost._id), firstPost, { updatedAt: timestamp });
  const requests = mockRequests((config) => {
    const rejectedResponse = { ...response(config, { message: "Forbidden" }), status: 403 };
    throw new axios.AxiosError("Forbidden", "ERR_BAD_REQUEST", config, undefined, rejectedResponse);
  });

  for (const [options, variables] of [
    [createPostMutationOptions(client), { content: "New draft" }],
    [updatePostMutationOptions(client), { id: firstPost._id, content: "Changed draft" }],
    [deletePostMutationOptions(client), firstPost._id],
  ]) {
    await assert.rejects(mutate(client, options, variables), /Forbidden/);
    assert.deepEqual(client.getQueryData(postKeys.list), [firstPost]);
    assert.deepEqual(client.getQueryData(postKeys.detail(firstPost._id)), firstPost);
    assert.equal(client.getQueryState(postKeys.list).dataUpdatedAt, timestamp);
    assert.equal(client.getQueryState(postKeys.detail(firstPost._id)).dataUpdatedAt, timestamp);
  }
  assert.equal(requests.length, 3);
});

test("saving one post does not mark an otherwise stale feed as fresh", async () => {
  const client = clientForTest();
  const oldTimestamp = Date.now() - 6 * 60 * 1000;
  client.setQueryData(postKeys.list, [firstPost, secondPost], { updatedAt: oldTimestamp });
  const updatedPost = { ...firstPost, content: "Saved" };
  const updatedSecondPost = { ...secondPost, content: "Changed elsewhere" };
  const requests = mockRequests((config) =>
    config.method === "put" ? { post: updatedPost } : [updatedPost, updatedSecondPost],
  );

  await mutate(client, updatePostMutationOptions(client), { id: firstPost._id, content: "Saved" });
  assert.equal(client.getQueryState(postKeys.list).dataUpdatedAt, oldTimestamp);
  assert.deepEqual(client.getQueryData(postKeys.detail(firstPost._id)), updatedPost);
  const feed = mountQuery(client, postsQueryOptions());
  assert.deepEqual(await settled(feed.observer), [updatedPost, updatedSecondPost]);
  assert.deepEqual(requests, [
    { method: "put", url: "/api/posts/post-1" },
    { method: "get", url: "/api/posts" },
  ]);
});

test("leaving a page cancels its pending HTTP request", async () => {
  const client = clientForTest();
  let requestSignal;
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  api.defaults.adapter = (config) => new Promise((_resolve, reject) => {
    requestSignal = config.signal;
    config.signal.addEventListener("abort", () => reject(new axios.CanceledError("Canceled")), { once: true });
    markStarted();
  });

  const feed = mountQuery(client, postsQueryOptions());
  await started;
  assert.equal(requestSignal.aborted, false);
  feed.unmount();
  assert.equal(requestSignal.aborted, true);
  assert.equal(client.getQueryState(postKeys.list).fetchStatus, "idle");
  assert.equal(client.getQueryData(postKeys.list), undefined);
});

test("an older in-flight GET cannot overwrite a successful edit", async () => {
  const client = clientForTest();
  client.setQueryData(postKeys.list, [firstPost], { updatedAt: Date.now() - 6 * 60 * 1000 });
  const savedPost = { ...firstPost, content: "Just saved" };
  let pendingSignal;
  let releaseOldResponse;
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  api.defaults.adapter = (config) => {
    if (config.method === "put") return Promise.resolve(response(config, { post: savedPost }));
    return new Promise((resolve) => {
      pendingSignal = config.signal;
      releaseOldResponse = () => resolve(response(config, [firstPost]));
      markStarted();
    });
  };

  const feed = mountQuery(client, postsQueryOptions());
  await started;
  await mutate(client, updatePostMutationOptions(client), { id: firstPost._id, content: savedPost.content });
  assert.equal(pendingSignal.aborted, true);
  releaseOldResponse();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(feed.observer.getCurrentResult().data, [savedPost]);
  assert.deepEqual(client.getQueryData(postKeys.detail(firstPost._id)), savedPost);
});

function seedNewSession(client) {
  advanceSessionVersion(client);
  client.clear();
  const newSessionPost = {
    ...firstPost,
    author: { _id: "user-2", username: "next-reader" },
    content: "New session's post",
  };
  client.setQueryData(["currentUser"], { _id: "user-2", username: "next-reader" });
  client.setQueryData(postKeys.list, [newSessionPost, secondPost]);
  client.setQueryData(postKeys.detail(firstPost._id), newSessionPost);
}

function cacheSnapshot(client) {
  return client.getQueryCache().getAll().map(({ queryKey, state }) => ({
    queryKey,
    data: state.data,
    dataUpdatedAt: state.dataUpdatedAt,
  }));
}

for (const operation of ["create", "update", "delete"]) {
  function mutationForOperation(client) {
    if (operation === "create") return [createPostMutationOptions(client), { content: "Old session draft" }];
    if (operation === "update") {
      return [updatePostMutationOptions(client), { id: firstPost._id, content: "Old session draft" }];
    }
    return [deletePostMutationOptions(client), firstPost._id];
  }

  function oldSessionResponse(config) {
    const oldPost = { ...firstPost, content: "Saved by previous session" };
    if (operation === "create") return response(config, { post: { ...oldPost, _id: "post-3" } });
    if (operation === "update") return response(config, { post: oldPost });
    return response(config, undefined);
  }

  test(`a pending ${operation} response cannot change the next session's cache`, async () => {
    const client = clientForTest();
    client.setQueryData(postKeys.list, [firstPost]);
    let markStarted;
    let finishRequest;
    const started = new Promise((resolve) => { markStarted = resolve; });
    api.defaults.adapter = (config) => new Promise((resolve) => {
      finishRequest = () => resolve(oldSessionResponse(config));
      markStarted();
    });

    const [options, variables] = mutationForOperation(client);
    const pendingMutation = mutate(client, options, variables);
    await started;
    seedNewSession(client);
    const expectedCache = cacheSnapshot(client);
    finishRequest();
    await pendingMutation;
    assert.deepEqual(cacheSnapshot(client), expectedCache);
  });

  test(`a session change during ${operation} query cancellation prevents old cache writes`, async () => {
    const client = clientForTest();
    client.setQueryData(postKeys.list, [firstPost]);
    api.defaults.adapter = (config) => Promise.resolve(oldSessionResponse(config));
    const cancelQueries = client.cancelQueries.bind(client);
    let markCancellationStarted;
    let finishCancellation;
    const cancellationStarted = new Promise((resolve) => { markCancellationStarted = resolve; });
    const cancellationCanFinish = new Promise((resolve) => { finishCancellation = resolve; });
    client.cancelQueries = async (...args) => {
      await cancelQueries(...args);
      markCancellationStarted();
      await cancellationCanFinish;
    };

    const [options, variables] = mutationForOperation(client);
    const pendingMutation = mutate(client, options, variables);
    await cancellationStarted;
    seedNewSession(client);
    const expectedCache = cacheSnapshot(client);
    finishCancellation();
    await pendingMutation;
    assert.deepEqual(cacheSnapshot(client), expectedCache);
  });
}
