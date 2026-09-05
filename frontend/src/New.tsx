import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "./api";
import { ToastContainer, toast } from "react-toastify";

function New() {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!content.trim()) {
      setError("Please write something before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      await api.post("/api/posts", {
        content: content.trim(),
      });

      navigate("/");
      toast.success("Post created successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "Failed to create post.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1>Create a new post</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          name="content"
          placeholder="Write your post..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />

        {error && <p>{error}</p>}

        <br />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit post"}
        </button>
      </form>

      <br />

      <button
        type="button"
        onClick={() => navigate(-1)}
        disabled={isSubmitting}
      >
        Go back
      </button>
      <ToastContainer />
    </>
  );
}

export default New;
