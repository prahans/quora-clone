import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Home from "./Home";
import Edit from "./Edit";
import New from "./New";
import Show from "./Show";
import Login from "./LoginPage";
import Signup from "./signup";
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
        <Route index element={<Home />} />
        <Route path="/edit" element={<Edit />} />
        <Route path="/new" element={<New />} />
        <Route path="/show" element={<Show />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
