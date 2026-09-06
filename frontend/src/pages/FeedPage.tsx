import axios from "axios";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { usePosts } from "../hooks/usePosts";
import { useDeletePost } from "../hooks/useDeletePost";

type CurrentUser = {
  id: string;
  username: string;
  email: string;
};

function FeedPage() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { data: posts = [], isPending, error, refetch, isFetching } = usePosts();
  const deletePost = useDeletePost();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/api/auth/me");
        setCurrentUser(response.data.user);
      } catch {
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleDelete = async (id: string) => {
    if (deletePost.isPending || isLoggingOut) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) return;

    try {
      await deletePost.mutateAsync(id);
      toast.success("Post deleted successfully!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete post.", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: true,
          theme: "light",
        });
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut || deletePost.isPending) return;
    try {
      setIsLoggingOut(true);
      await api.post("/api/auth/logout");
      queryClient.clear();
      navigate("/login");
      toast.success(`Goodbye, ${currentUser?.username}!`, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
    } catch {
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isPending) {
    return <h2>Loading posts...</h2>;
  }

  if (error) {
    return (
      <>
        <h2>
          {axios.isAxiosError(error)
            ? error.response?.data?.message || "Failed to load posts. Please try again."
            : "Something went wrong loading posts."}
        </h2>
        <button onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? "Retrying..." : "Try again"}
        </button>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </>
    );
  }

  return (
    <>
      <h1>Quora Posts</h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: "flex-end",
        }}
      >
        <h3>{currentUser?.username}</h3>
        <button onClick={handleLogout} disabled={isLoggingOut || deletePost.isPending}>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((post) => (
          <div className="post" key={post._id}>
            <h3>@{post.username}</h3>

            <p>{post.content}</p>

            <button onClick={() => navigate(`/show/${post._id}`)}>
              See details
            </button>

            {currentUser?.id === post.author && (
              <>
                <button onClick={() => navigate(`/edit/${post._id}`)}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post._id)}
                  disabled={deletePost.isPending || isLoggingOut}
                >
                  {deletePost.isPending && deletePost.variables === post._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </>
            )}
          </div>
        ))
      )}

      <br />
      <button
        onClick={() =>
          navigate("/new", {
            state: { username: currentUser?.username || "" },
          })
        }
      >
        Create a new post
      </button>
    </>
  );
}

export default FeedPage;
