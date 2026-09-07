import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { usePosts } from "../hooks/usePosts";
import { useDeletePost } from "../hooks/useDeletePost";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/getErrorMessage";

function FeedPage() {
  const navigate = useNavigate();

  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;
  const {
    data: posts = [],
    isPending,
    error,
    isRefetchError,
    refetch,
    isFetching,
  } = usePosts(Boolean(currentUser));
  const deletePost = useDeletePost();
  const logout = useLogout();
  const isLoggingOut = logout.isPending;

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
      toast.error(getErrorMessage(error, "Failed to delete post."));
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut || deletePost.isPending) return;
    try {
      await logout.mutateAsync();
      navigate("/login");
      toast.success(`Goodbye, ${currentUser?.username}!`, {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: true,
        theme: "light",
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to log out. Please try again."),
      );
    }
  };

  if (currentUserQuery.isPending) return <h2>Loading account...</h2>;

  if (currentUserQuery.error && !currentUser) {
    return (
      <>
        <h2>
          {getErrorMessage(
            currentUserQuery.error,
            "Failed to load your account.",
          )}
        </h2>
        <button
          onClick={() => void currentUserQuery.refetch()}
          disabled={currentUserQuery.isFetching}
        >
          Try again
        </button>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <h2>Please log in to view posts.</h2>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </>
    );
  }

  if (isPending) {
    return <h2>Loading posts...</h2>;
  }

  if (error && !isRefetchError) {
    return (
      <>
        <h2>
          {getErrorMessage(error, "Failed to load posts. Please try again.")}
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
      {currentUserQuery.error && (
        <p role="alert">
          {getErrorMessage(
            currentUserQuery.error,
            "Unable to refresh your account.",
          )}
        </p>
      )}
      {error && (
        <p role="alert">{getErrorMessage(error, "Unable to refresh posts.")}</p>
      )}
      <button
        onClick={() => void refetch()}
        disabled={isFetching || deletePost.isPending || isLoggingOut}
      >
        {isFetching ? "Refreshing..." : "Refresh posts"}
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          justifyContent: "flex-end",
        }}
      >
        <h3>{currentUser?.username}</h3>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut || deletePost.isPending}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((post) => (
          <div className="post" key={post._id}>
            <h3>@{post.author.username}</h3>

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
      <button onClick={() => navigate("/new")}>Create a new post</button>
    </>
  );
}

export default FeedPage;
