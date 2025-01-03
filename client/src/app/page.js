import Sidebar from '../components/Sidebar';

export default function Home() {
  return (
    <div className="main-container">
      <Sidebar />
      <div className="content">
        <h1>Welcome to Cold Emailer</h1>
        <p>Select an option from the sidebar to get started.</p>
      </div>
    </div>
  );
}
