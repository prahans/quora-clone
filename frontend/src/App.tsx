import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import Edit from "./Edit";
import New from "./New";
import Show from "./Show";
import Login from "./LoginPage";
import Signup from "./signup";

function App() {
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
    </BrowserRouter>
  );
}

export default App;
