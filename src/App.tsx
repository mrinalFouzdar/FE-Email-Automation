import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRouter from './AppRouter';
import UserLabelSuggestions from './pages/UserLabelSuggestions';

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <AppRouter />
    </>
  );
}

export default App;
