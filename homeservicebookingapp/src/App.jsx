
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate
} from "react-router-dom";

import "./App.css";

const AppContext = createContext(null);

const SERVICES = [
  { id: 1, name: "Plumbing", price: 500, icon: "🔧" },
  { id: 2, name: "Electrical", price: 600, icon: "💡" },
  { id: 3, name: "Cleaning", price: 800, icon: "🧹" },
  { id: 4, name: "AC Repair", price: 1000, icon: "❄️" },
  { id: 5, name: "Carpenter", price: 700, icon: "🪚" },
  { id: 6, name: "Appliance Repair", price: 900, icon: "🛠️" },
];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

export default function App() {
  const [users, setUsers] = useState(() =>
    readStorage("hs_users", [
      {
        id: "admin-1",
        name: "Admin",
        email: "admin@homeservices.com",
        password: "Admin123",
        role: "admin",
        service: "",
      },
    ])
  );

  const [session, setSession] = useState(() =>
    readStorage("hs_session", null)
  );

  const [bookings, setBookings] = useState(() =>
    readStorage("hs_bookings", [])
  );

  const [reviews, setReviews] = useState(() =>
    readStorage("hs_reviews", [])
  );

  useEffect(() => {
    localStorage.setItem("hs_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (session) {
      localStorage.setItem("hs_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("hs_session");
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem("hs_bookings", JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem("hs_reviews", JSON.stringify(reviews));
  }, [reviews]);

  // REGISTER
  const register = (form) => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email || !form.password) {
      return { success: false, message: "Please fill in all fields." };
    }

    if (form.password.length < 6) {
      return {
        success: false,
        message: "Password must contain at least 6 characters.",
      };
    }

    if (users.some((user) => user.email === email)) {
      return { success: false, message: "Email already registered." };
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: form.password,
      role: form.role === "provider" ? "provider" : "user",
      service: form.role === "provider" ? form.service : "",
    };

    setUsers((previous) => [...previous, newUser]);
    return { success: true, message: "Account created successfully!" };
  };

  // LOGIN
  const login = (email, password) => {
    const user = users.find(
      (item) =>
        item.email === email.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    setSession(user);
    return { success: true, role: user.role };
  };

  // LOGOUT
  const logout = () => setSession(null);

  // CREATE BOOKING
  const createBooking = (service, date, address) => {
    if (!session || session.role !== "user") {
      return { success: false, message: "Please log in as a customer." };
    }

    if (!date || !address.trim()) {
      return { success: false, message: "Enter date and address." };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
      return { success: false, message: "Choose today or a future date." };
    }

    const selectedService = SERVICES.find((item) => item.name === service);

    if (!selectedService) {
      return { success: false, message: "Please select a valid service." };
    }

    const newBooking = {
      id: Date.now().toString(),
      userId: session.id,
      customerName: session.name,
      service,
      date,
      address: address.trim(),
      price: selectedService.price,
      status: "Pending",
      providerId: "",
    };

    setBookings((previous) => [...previous, newBooking]);
    return { success: true, message: "Booking created successfully!" };
  };

  // UPDATE BOOKING
  const updateBooking = (id, changes) => {
    setBookings((previous) =>
      previous.map((booking) =>
        booking.id === id ? { ...booking, ...changes } : booking
      )
    );
  };

  // SUBMIT REVIEW
  const addReview = (bookingId, rating, comment) => {
    const booking = bookings.find((item) => item.id === bookingId);

    if (
      !session ||
      !booking ||
      booking.userId !== session.id ||
      booking.status !== "Completed"
    ) {
      alert("You can review only your completed bookings.");
      return;
    }

    if (reviews.some((review) => review.bookingId === bookingId)) {
      alert("You have already reviewed this booking.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      alert("Please select a rating from 1 to 5.");
      return;
    }

    setReviews((previous) => [
      ...previous,
      {
        id: Date.now().toString(),
        bookingId,
        userId: session.id,
        customerName: session.name,
        service: booking.service,
        rating,
        comment: comment.trim(),
      },
    ]);

    alert("Review submitted successfully!");
  };

  const value = {
    users,
    setUsers,
    session,
    bookings,
    reviews,
    SERVICES,
    register,
    login,
    logout,
    createBooking,
    updateBooking,
    addReview,
  };

  return (
    <AppContext.Provider value={value}>
      <BrowserRouter>
        <Header />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/customer"
              element={
                <Protected role="user">
                  <CustomerDashboard />
                </Protected>
              }
            />

            <Route
              path="/provider"
              element={
                <Protected role="provider">
                  <ProviderDashboard />
                </Protected>
              }
            />

            <Route
              path="/admin"
              element={
                <Protected role="admin">
                  <AdminDashboard />
                </Protected>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Home Services Booking App © 2026</p>
        </footer>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

function useApp() {
  return useContext(AppContext);
}

// HEADER
function Header() {
  const { session, logout } = useApp();
  const navigate = useNavigate();

  const paths = {
    user: "/customer",
    provider: "/provider",
    admin: "/admin",
  };

  return (
    <header className="header">
      <Link to="/" className="logo">
        🏠 Home Services
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/services">Services</Link>

        {session ? (
          <>
            <Link to={paths[session.role]}>Dashboard</Link>
            <span>Hi, {session.name}</span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}

// HOME
function Home() {
  return (
    <section className="hero">
      <h1>Home Services at Your Doorstep</h1>
      <p>Book trusted professionals for all your home needs.</p>

      <Link to="/services" className="primary-button">
        Explore Services
      </Link>

      <h2>Popular Services</h2>
      <ServiceGrid serviceList={SERVICES.slice(0, 3)} />
    </section>
  );
}

// SERVICE CARDS
function ServiceGrid({ serviceList = SERVICES }) {
  return (
    <div className="service-grid">
      {serviceList.map((service) => (
        <div className="service-card" key={service.id}>
          <div className="service-icon">{service.icon}</div>
          <h3>{service.name}</h3>
          <p>Starting from ₹{service.price}</p>
          <Link to="/login" className="primary-button">
            Book Now
          </Link>
        </div>
      ))}
    </div>
  );
}

// SERVICES PAGE
function ServicesPage() {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("2000");

  const filteredServices = SERVICES.filter(
    (service) =>
      service.name.toLowerCase().includes(search.toLowerCase()) &&
      service.price <= Number(maxPrice)
  );

  return (
    <section className="page">
      <h1>Our Services</h1>

      <div className="service-filters">
        <input
          placeholder="Search services..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        >
          <option value="2000">All Prices</option>
          <option value="600">Up to ₹600</option>
          <option value="800">Up to ₹800</option>
          <option value="1000">Up to ₹1000</option>
        </select>
      </div>

      {filteredServices.length ? (
        <ServiceGrid serviceList={filteredServices} />
      ) : (
        <p>No services found.</p>
      )}
    </section>
  );
}

// LOGIN
function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = login(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    const paths = {
      user: "/customer",
      provider: "/provider",
      admin: "/admin",
    };

    navigate(paths[result.role]);
  };

  return (
    <section className="form-container">
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" className="primary-button">
          Login
        </button>
      </form>

      <p>
        New user? <Link to="/signup">Create an account</Link>
      </p>

      <p>Demo Admin: admin@homeservices.com / Admin123</p>
    </section>
  );
}

// SIGNUP
function Signup() {
  const { register } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    service: SERVICES[0].name,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = register(form);

    if (!result.success) {
      setError(result.message);
      setMessage("");
      return;
    }

    setError("");
    setMessage(result.message);
    navigate("/login");
  };

  return (
    <section className="form-container">
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          minLength={6}
          required
        />

        <label>Account Type</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
        >
          <option value="user">Customer</option>
          <option value="provider">Service Provider</option>
        </select>

        {form.role === "provider" && (
          <>
            <label>Service Specialization</label>
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
            >
              {SERVICES.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </>
        )}

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button type="submit" className="primary-button">
          Sign Up
        </button>
      </form>

      <p>
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}

// PROTECTED DASHBOARDS
function Protected({ role, children }) {
  const { session } = useApp();

  if (!session) return <Navigate to="/login" replace />;

  if (session.role !== role) return <Navigate to="/" replace />;

  return children;
}

// BOOKING LIST
function BookingList({ bookings, onCancel, onComplete, onReview }) {
  if (bookings.length === 0) {
    return <p>No bookings available.</p>;
  }

  return (
    <div className="booking-list">
      {bookings.map((booking) => (
        <div className="booking-card" key={booking.id}>
          <h3>{booking.service}</h3>
          <p>Customer: {booking.customerName}</p>
          <p>Date: {booking.date}</p>
          <p>Address: {booking.address}</p>
          <p>Price: ₹{booking.price}</p>
          <p>Status: <strong>{booking.status}</strong></p>

          {onCancel && booking.status === "Pending" && (
            <button
              className="danger-button"
              onClick={() => onCancel(booking.id)}
            >
              Cancel Booking
            </button>
          )}

          {onComplete &&
            booking.status !== "Completed" &&
            booking.status !== "Cancelled" && (
              <button
                className="primary-button"
                onClick={() => onComplete(booking.id)}
              >
                Mark Completed
              </button>
            )}

          {onReview && (
            <ReviewForm booking={booking} onReview={onReview} />
          )}
        </div>
      ))}
    </div>
  );
}

// REVIEW FORM
function ReviewForm({ booking, onReview }) {
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const submitReview = (event) => {
    event.preventDefault();
    onReview(booking.id, Number(rating), comment);
  };

  return (
    <form onSubmit={submitReview} className="review-form">
      <label>Rating</label>
      <select
        value={rating}
        onChange={(event) => setRating(event.target.value)}
      >
        <option value="5">5 - Excellent</option>
        <option value="4">4 - Very Good</option>
        <option value="3">3 - Good</option>
        <option value="2">2 - Average</option>
        <option value="1">1 - Poor</option>
      </select>

      <label>Comment</label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Write your review"
      />

      <button type="submit" className="primary-button">
        Submit Review
      </button>
    </form>
  );
}

// CUSTOMER DASHBOARD
function CustomerDashboard() {
  const {
    session,
    bookings,
    createBooking,
    updateBooking,
    reviews,
    addReview,
  } = useApp();

  const [service, setService] = useState(SERVICES[0].name);
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");

  const myBookings = bookings.filter(
    (booking) => booking.userId === session.id
  );

  const reviewedIds = reviews
    .filter((review) => review.userId === session.id)
    .map((review) => review.bookingId);

  const reviewableBookings = myBookings.filter(
    (booking) =>
      booking.status === "Completed" &&
      !reviewedIds.includes(booking.id)
  );

  const handleBooking = (event) => {
    event.preventDefault();

    const result = createBooking(service, date, address);

    if (!result.success) {
      alert(result.message);
      return;
    }

    alert(result.message);
    setDate("");
    setAddress("");
  };

  return (
    <section className="page">
      <h1>Customer Dashboard</h1>
      <p>Welcome, {session.name}!</p>

      <div className="form-container">
        <h2>Book a Service</h2>

        <form onSubmit={handleBooking}>
          <label>Select Service</label>
          <select
            value={service}
            onChange={(event) => setService(event.target.value)}
          >
            {SERVICES.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name} - ₹{item.price}
              </option>
            ))}
          </select>

          <label>Booking Date</label>
          <input
            type="date"
            min={new Date().toLocaleDateString("en-CA")}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />

          <label>Service Address</label>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
          />

          <button type="submit" className="primary-button">
            Book Service
          </button>
        </form>
      </div>

      <h2>My Bookings</h2>

      <BookingList
        bookings={myBookings}
        onCancel={(id) =>
          updateBooking(id, { status: "Cancelled" })
        }
      />

      <h2>Review Completed Bookings</h2>

      <BookingList
        bookings={reviewableBookings}
        onReview={addReview}
      />

      <h2>My Reviews</h2>

      {reviews
        .filter((review) => review.userId === session.id)
        .map((review) => (
          <div className="booking-card" key={review.id}>
            <h3>{review.service}</h3>
            <p>Rating: {"⭐".repeat(review.rating)}</p>
            <p>{review.comment || "No comment added."}</p>
          </div>
        ))}
    </section>
  );
}

// PROVIDER DASHBOARD
function ProviderDashboard() {
  const { session, bookings, updateBooking } = useApp();

  const providerBookings = bookings.filter(
    (booking) =>
      booking.service === session.service ||
      booking.providerId === session.id
  );

  const activeBookings = providerBookings.filter(
    (booking) =>
      booking.status !== "Completed" &&
      booking.status !== "Cancelled"
  );

  const completedBookings = providerBookings.filter(
    (booking) => booking.status === "Completed"
  );

  return (
    <section className="page">
      <h1>Service Provider Dashboard</h1>
      <p>Welcome, {session.name}!</p>
      <p>Specialization: {session.service}</p>

      <h2>Service Requests</h2>

      <BookingList
        bookings={activeBookings}
        onComplete={(id) =>
          updateBooking(id, {
            status: "Completed",
            providerId: session.id,
          })
        }
      />

      <h2>Completed Services</h2>
      <BookingList bookings={completedBookings} />
    </section>
  );
}

// ADMIN DASHBOARD
function AdminDashboard() {
  const {
    users,
    bookings,
    reviews,
    updateBooking,
    setUsers,
  } = useApp();

  const customers = users.filter((user) => user.role === "user");
  const providers = users.filter((user) => user.role === "provider");

  return (
    <section className="page">
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Customers</h3>
          <p>{customers.length}</p>
        </div>

        <div className="stat-card">
          <h3>Providers</h3>
          <p>{providers.length}</p>
        </div>

        <div className="stat-card">
          <h3>Bookings</h3>
          <p>{bookings.length}</p>
        </div>

        <div className="stat-card">
          <h3>Reviews</h3>
          <p>{reviews.length}</p>
        </div>
      </div>

      <h2>Customers</h2>

      {customers.map((user) => (
        <div className="booking-card" key={user.id}>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
      ))}

      <h2>Service Providers</h2>

      {providers.map((provider) => (
        <div className="booking-card" key={provider.id}>
          <p>Name: {provider.name}</p>
          <p>Email: {provider.email}</p>
          <p>Service: {provider.service}</p>
        </div>
      ))}

      <h2>Manage Bookings</h2>

      <BookingList
        bookings={bookings}
        onComplete={(id) =>
          updateBooking(id, { status: "Completed" })
        }
        onCancel={(id) =>
          updateBooking(id, { status: "Cancelled" })
        }
      />

      <h2>Customer Reviews</h2>

      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <div className="booking-card" key={review.id}>
            <h3>{review.service}</h3>
            <p>Customer: {review.customerName}</p>
            <p>Rating: {"⭐".repeat(review.rating)}</p>
            <p>{review.comment || "No comment added."}</p>
          </div>
        ))
      )}

      <h2>Account Management</h2>

      <button
        className="danger-button"
        onClick={() => {
          const confirmed = window.confirm(
            "Delete all customer and provider accounts?"
          );

          if (confirmed) {
            setUsers((previous) =>
              previous.filter((user) => user.role === "admin")
            );
          }
        }}
      >
        Delete Customer and Provider Accounts
      </button>
    </section>
  );
}
