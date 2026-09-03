import { useLocation, useNavigate } from "react-router-dom";

type PostProps = {
  _id: string;
  username: string;
  content: string;
};

function Show() {
  const location = useLocation();
  const state = location.state as { post: PostProps } | null;
  const post = state?.post;
  const navigate = useNavigate();
  return (
    <>
      <h2>see in details</h2>
      <p>post id : {post?._id}</p>
      <div className="post">
        <h3 style={{ fontStyle: "italic" }}>@{post?.username}</h3>
        <p>{post?.content}</p>
      </div>
      <button onClick={() => navigate(-1)}>go back</button>
    </>
  );
}

export default Show;
