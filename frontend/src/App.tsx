import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import FeedPage from "./FeedPage";
import EditPostPage from "./EditPostPage";
import CreatePostPage from "./CreatePostPage";
import PostDetailsPage from "./PostDetailsPage";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import { apiConfigurationError } from "./api/api";

function App() {
  if (apiConfigurationError) {
    return (
      <main>
        <h1>Service unavailable</h1>
        <p>{apiConfigurationError}</p>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<FeedPage />} />
        <Route path="/edit/:id" element={<EditPostPage />} />
        <Route path="/new" element={<CreatePostPage />} />
        <Route path="/show/:id" element={<PostDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
