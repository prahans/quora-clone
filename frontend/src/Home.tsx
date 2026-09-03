import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type Post = {
  _id: string;
  author: string;
  username: string;
  content: string;
};

type CurrentUser = {
  id: string;
  username: string;
  email: string;
};

function Home() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await axios.get<Post[]>(`${API_URL}/api/posts`, {
          withCredentials: true,
        });

        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);

        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.message || "Failed to load posts.");
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          withCredentials: true,
        });

        setCurrentUser(response.data.user);
      } catch (error) {
        console.error("Failed to get current user:", error);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?",
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/api/posts/${id}`, {
        withCredentials: true,
      });

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post._id !== id),
      );
    } catch (error) {
      console.error("Failed to delete post:", error);

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to delete post.");
      } else {
        alert("Something went wrong.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );

      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <h2>Loading posts...</h2>;
  }

  if (error) {
    return (
      <>
        <h2>{error}</h2>
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
        <button onClick={handleLogout}>Logout</button>
      </div>

      {posts.length === 0 ? (
        <p>No posts available.</p>
      ) : (
        posts.map((post) => (
          <div className="post" key={post._id}>
            <h3>@{post.username}</h3>

            <p>{post.content}</p>

            <button
              onClick={() =>
                navigate("/show", {
                  state: { post },
                })
              }
            >
              See details
            </button>

            {currentUser?.id === post.author && (
              <>
                <button
                  onClick={() =>
                    navigate("/edit", {
                      state: { post },
                    })
                  }
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(post._id)}>Delete</button>
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

export default Home;
