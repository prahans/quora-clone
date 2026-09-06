import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import FeedPage from "./pages/FeedPage";
import EditPostPage from "./pages/EditPostPage";
import CreatePostPage from "./pages/CreatePostPage";
import PostDetailsPage from "./pages/PostDetailsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { apiConfigurationError } from "./api";

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
