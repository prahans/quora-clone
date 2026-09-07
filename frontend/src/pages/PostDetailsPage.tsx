import { useNavigate, useParams } from "react-router-dom";
import { usePost } from "../hooks/usePost";
import { getErrorMessage } from "../utils/getErrorMessage";

function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: post, isPending, error, refetch, isFetching } = usePost(id);

  if (!id) return <h2>Post not found.</h2>;
  if (isPending) return <h2>Loading post...</h2>;

  if (!post) {
    return (
      <>
        <h2>{getErrorMessage(error, "Failed to load post.")}</h2>
        <button onClick={() => void refetch()} disabled={isFetching}>
          Try again
        </button>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </>
    );
  }

  return (
    <>
      <h2>see in details</h2>
      {error && (
        <p role="alert">
          {getErrorMessage(error, "Unable to refresh this post.")}
        </p>
      )}
      <p>post id : {post._id}</p>
      <div className="post">
        <h3 style={{ fontStyle: "italic" }}>@{post.author.username}</h3>
        {post.image?.url && (
          <img
            src={post.image.url}
            alt={`Post by ${post.author.username}`}
            style={{ maxWidth: "500px", width: "100%", height: "auto" }}
          />
        )}
        <p>{post.content}</p>
      </div>
      <button onClick={() => navigate(-1)}>go back</button>
    </>
  );
}

export default PostDetailsPage;
