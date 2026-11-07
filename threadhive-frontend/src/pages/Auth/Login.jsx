import { Container, Card, Form, Button, Spinner } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginUser } from "../../reducers/authSlice.js";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hasNavigated = useRef(false);

  const { token } = useSelector((state) => state.auth);
  const { status: loginStatus, error } = useSelector(
    (state) => state.auth.login,
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(loginUser(form));
  };

  useEffect(() => {
    if (token && !hasNavigated.current) {
      hasNavigated.current = true;
      alert("Login successful!");
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <Container
      fluid
      className="auth-container d-flex align-items-center justify-content-center"
    >
      <Card className="auth-card shadow-lg border-0 rounded-4 p-4 p-md-5">
        <h2 className="auth-title">Login</h2>

        <Form onSubmit={handleSubmit}>
          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingEmail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingEmail" className="auth-form-label">
              Email
            </label>
          </Form.Floating>

          <Form.Floating className="mb-4">
            <Form.Control
              id="floatingPassword"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder=" "
              required
              className="auth-form-control"
            />
            <label htmlFor="floatingPassword" className="auth-form-label">
              Password
            </label>
          </Form.Floating>

          {error && <div className="auth-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            className="auth-submit-btn"
            disabled={loginStatus === "pending"}
          >
            {loginStatus === "pending" ? (
              <Spinner as="span" animation="border" size="sm" role="status" />
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i>Login
              </>
            )}
          </Button>
        </Form>
      </Card>
    </Container>
  );
}

export default Login;
