import { useNavigate, useLocation } from "react-router-dom";
import { Nav, ListGroup } from "react-bootstrap";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${!isOpen ? 'mobile-hidden' : ''}`}>
        <Nav className="flex-column">
          {/* Menu Section */}
          <div className="mb-4">
            <h6 className="text-uppercase fw-bold small mb-2 px-3" style={{ color: 'var(--text-muted)' }}>Menu</h6>
            <ListGroup variant="flush">
              <ListGroup.Item 
                action
                active={isActive("/home")}
                onClick={() => handleNavigation("/home")}
                className="border-0 rounded mx-2"
              >
                🏠 Home
              </ListGroup.Item>
              <ListGroup.Item 
                action
                active={isActive("/profile")}
                onClick={() => handleNavigation("/profile")}
                className="border-0 rounded mx-2"
              >
                👤 Profile
              </ListGroup.Item>
            </ListGroup>
          </div>
        </Nav>
      </aside>
    </>
  );
}

export default Sidebar;
