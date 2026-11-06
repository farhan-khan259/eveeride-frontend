import React, { useState, useEffect, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Package,
  History,
  UserRound,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  UsersRound,
  Headphones,
  ChevronRight,
  ArrowRight,
  Bell,
  Search,
  Copy,
  Check,
  Play,
  Clock,
  ShieldCheck,
  Gift,
  Crown,
  Wallet,
  LogIn,
  LogOut,
  Menu,
  X,
  Plus,
  Minus,
  Trash2,
  Video,
  Settings,
  Ticket,
  Receipt,
  TrendingUp,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageCircle,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ExternalLink,
  Camera,
} from "lucide-react";
import { api, rupees, when, blank } from "./api.js";
import "./styles.css";
const Context = createContext();
const useApp = () => useContext(Context);
function App() {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [toast, setToast] = useState(null),
    [rev, setRev] = useState(0),
    [pub, setPub] = useState(null),
    [impersonating, setImpersonating] = useState(
      Boolean(sessionStorage.getItem("eveeride.admin.token")),
    );
  const tell = (message, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 6000);
  };
  useEffect(() => {
    api
      .get("/public")
      .then((r) => {
        if (r.data?.plan && r.data.serverTime) setPub(r.data);
      })
      .catch(() => {});
    if (sessionStorage.getItem("eveeride.token"))
      api
        .get("/me")
        .then((r) => setUser(r.data))
        .catch(() => sessionStorage.removeItem("eveeride.token"))
        .finally(() => setReady(true));
    else setReady(true);
  }, []);
  const refresh = () => setRev((x) => x + 1);
  async function action(fn) {
    if (!user) {
      tell("Please sign in to continue.", true);
      return false;
    }
    try {
      const r = await fn();
      tell(r?.data?.message || "Saved successfully");
      refresh();
      return r?.data || true;
    } catch (e) {
      tell(
        e.response?.data?.message ||
          "Could not reach the API. Check the backend configuration.",
        true,
      );
      return false;
    }
  }
  async function login(data) {
    sessionStorage.removeItem(`eveeride.launch-announcement.seen:${data.user.id}`);
    sessionStorage.setItem("eveeride.token", data.token);
    setUser(data.user);
    refresh();
  }
  async function startImpersonation(data) {
    const currentToken = sessionStorage.getItem("eveeride.token");
    if (!currentToken || user?.role !== "admin") return false;
    sessionStorage.setItem("eveeride.admin.token", currentToken);
    sessionStorage.setItem("eveeride.admin.user", JSON.stringify(user));
    sessionStorage.setItem("eveeride.token", data.token);
    setUser(data.user);
    setImpersonating(true);
    refresh();
    return true;
  }
  function returnToAdmin() {
    const token = sessionStorage.getItem("eveeride.admin.token"),
      saved = sessionStorage.getItem("eveeride.admin.user");
    if (!token || !saved) return false;
    sessionStorage.setItem("eveeride.token", token);
    sessionStorage.removeItem("eveeride.admin.token");
    sessionStorage.removeItem("eveeride.admin.user");
    setUser(JSON.parse(saved));
    setImpersonating(false);
    refresh();
    return true;
  }
  async function logout() {
    if (impersonating) {
      returnToAdmin();
      return;
    }
    try {
      await api.post("/auth/logout");
    } catch {}
    if (user?.id) {
      sessionStorage.removeItem(`eveeride.launch-announcement.seen:${user.id}`);
    }
    sessionStorage.removeItem("eveeride.token");
    setUser(null);
    refresh();
  }
  return (
    <Context.Provider
      value={{
        user,
        pub,
        ready,
        rev,
        tell,
        action,
        login,
        logout,
        impersonating,
        startImpersonation,
        returnToAdmin,
        updateUser: setUser,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EntryRoute />} />
          <Route path="/login" element={<GuestOnly><Auth /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Auth register /></GuestOnly>} />
          <Route path="/forgot" element={<GuestOnly><Reset /></GuestOnly>} />
          <Route path="/reset" element={<GuestOnly><Reset reset /></GuestOnly>} />
          <Route path="/admin/login" element={<GuestOnly><Auth admin /></GuestOnly>} />
          <Route path="/admin/*" element={<RequireAuth admin><Admin /></RequireAuth>} />
          <Route path="/*" element={<RequireAuth><Shell /></RequireAuth>} />
        </Routes>
        {toast && (
          <div role="status" className={"toast " + (toast.error ? "bad" : "")}>
            <span>
              {toast.error ? (
                <AlertCircle size={20} />
              ) : (
                <CheckCircle2 size={20} />
              )}
            </span>
            {toast.message}
            <button
              className="icon-btn"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </BrowserRouter>
    </Context.Provider>
  );
}
function LoadingSession() {
  return <div className="loading">Checking session…</div>;
}
function EntryRoute() {
  const { user, ready } = useApp();
  if (!ready) return <LoadingSession />;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "admin" ? <Navigate to="/admin" replace /> : <Shell />;
}
function GuestOnly({ children }) {
  const { user, ready } = useApp();
  if (!ready) return <LoadingSession />;
  return user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} replace /> : children;
}
function RequireAuth({ children, admin = false }) {
  const { user, ready } = useApp();
  const location = useLocation();
  if (!ready) return <LoadingSession />;
  if (!user)
    return <Navigate to={admin ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
function useData(endpoint, fallback, pollMs = 0) {
  const { user, rev } = useApp();
  const [data, setData] = useState(fallback),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let cancel = false;
    if (!user) {
      setData(fallback);
      return;
    }
    async function load(showLoading = false) {
      if (showLoading) setLoading(true);
      try {
        const r = await api.get(endpoint);
        if (!cancel) {
          setData(r.data);
          setError("");
        }
      } catch (e) {
        if (!cancel)
          setError(
            e.response?.data?.message ||
              "Unable to load records. Please retry.",
          );
      } finally {
        if (!cancel && showLoading) setLoading(false);
      }
    }
    const refreshVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    load(true);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    const interval = pollMs ? setInterval(refreshVisible, pollMs) : null;
    return () => {
      cancel = true;
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
      if (interval) clearInterval(interval);
    };
  }, [endpoint, user?.id, rev, pollMs]);
  return { data, loading, error };
}
const nav = [
  ["/", "Overview", LayoutDashboard],
  ["/plans", "Explore plans", Layers],
  ["/products", "My product", Package],
  ["/team", "My team", Users],
  ["/salary", "Salary rewards", Crown],
  ["/activity", "Transactions", History],
  ["/promo", "Promo rewards", Gift],
];
const pageLabels = Object.fromEntries([
  ...nav.map(([path, label]) => [path, label]),
  ["/tasks", "Daily tasks"],
  ["/support", "Help & support"],
  ["/account", "Account settings"],
  ["/notifications", "Notifications"],
  ["/terms", "Terms & conditions"],
  ["/privacy", "Privacy policy"],
  ["/deposit", "Deposit"],
  ["/withdraw", "Withdrawal"],
]);
function Brand() {
  return (
    <Link to="/" className="brand">
      <img className="brand-icon" src="/icons/eveeride-mark.png" alt="" />
      <div>
        Evee<span>Ride</span>
      </div>
    </Link>
  );
}
function notificationIsRead(notification, userId) {
  if (notification.read === true) return true;
  return Boolean(
    notification.readBy?.some(
      (reader) => String(reader?._id || reader) === String(userId),
    ),
  );
}
function Shell() {
  const { user, pub, logout, impersonating, returnToAdmin } = useApp(),
    [menu, setMenu] = useState(false),
    { data: headerNotifications } = useData("/notifications", [], 30000),
    unreadNotifications = headerNotifications.filter(
      (notification) => !notificationIsRead(notification, user?.id),
    ).length;
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
  }, [location]);
  return (
    <div className="app">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Brand />
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {nav.map(([to, name, Icon]) => (
            <NavLink end to={to} key={to}>
              <Icon size={19} />
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/support">
            <Headphones size={18} />
            Help & support
            <ExternalLink size={14} />
          </NavLink>
          <NavLink to="/account">
            <UserRound size={18} />
            Account settings
          </NavLink>
          <NavLink to="/terms">
            <Receipt size={18} />
            Terms & conditions
          </NavLink>
          <NavLink to="/privacy">
            <Lock size={18} />
            Privacy policy
          </NavLink>
        </div>
      </aside>
      <div className="workspace">
        {impersonating && (
          <div className="impersonation-banner">
            <Eye size={17} />
            <span>
              Viewing as <b>{user?.name}</b> · Read-only admin access
            </span>
            <Button
              secondary
              onClick={() => {
                returnToAdmin();
                window.location.assign("/admin/users");
              }}
            >
              Return to admin
            </Button>
          </div>
        )}
        <header>
          <button
            className="mobile-menu icon-btn"
            onClick={() => setMenu(!menu)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <b>
              {pageLabels[location.pathname] || "Account"}
            </b>
          </div>
          <div className="header-right">
            <span className="time-zone">
              <span />
              Pakistan Standard Time
            </span>
            <Link
              className="icon-btn notification"
              to="/notifications"
              aria-label={`${unreadNotifications} unread notifications`}
            >
              <Bell size={20} />
              <span className="notification-badge">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            </Link>
            <Link to={user ? "/account" : "/login"} className="avatar-link">
              <ProfileAvatar user={user} />
            </Link>
          </div>
        </header>
        <main>
          {!pub && (
            <div className="setup-note">
              <ShieldCheck size={16} />
              <span>
                The service is temporarily unavailable. Start the API to access
                accounts and transactions.
              </span>
              <Link to="/support">
                Setup details <ArrowRight size={14} />
              </Link>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/products" element={<Plans owned />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/team" element={<Team />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/promo" element={<Promo />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/account" element={<Account />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/terms" element={<Legal />} />
            <Route path="/privacy" element={<Legal privacy />} />
            <Route path="/support" element={<Support />} />
            <Route
              path="*"
              element={
                <Empty
                  title="Page not found"
                  text="Return to your workspace."
                  to="/"
                  label="Back to overview"
                />
              }
            />
          </Routes>
          <footer>
            <span>© {new Date().getFullYear()} EveeRide</span>
            <span>Transparent tasks. Trackable rewards.</span>
            <Link to="/privacy">Privacy policy</Link>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav">
        {[
          ["/", "Home", LayoutDashboard],
          ["/plans", "Plans", Layers],
          ["/tasks", "Daily tasks", Play],
          ["/activity", "Activity", History],
          ["/account", "Account", UserRound],
        ].map(([to, n, I]) => (
          <NavLink end to={to} key={to}>
            <I size={21} />
            {n}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
function PageTitle({
  eyebrow = "YOUR WORKSPACE",
  title,
  description,
  children,
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
function Tag({ children }) {
  return <span className="tag">{children}</span>;
}
function ProfileAvatar({ user, large = false }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true,
      objectUrl = "";
    if (!user?.avatarVersion) {
      setSrc("");
      return () => {};
    }
    api
      .get("/account/avatar", { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setSrc(objectUrl);
      })
      .catch(() => active && setSrc(""));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.avatarVersion]);
  return (
    <span className={`avatar${large ? " large" : ""}`}>
      {src ? <img src={src} alt="" /> : user?.name?.slice(0, 1) || "U"}
    </span>
  );
}
function Button({
  children,
  onClick,
  type = "button",
  secondary = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn${secondary ? " secondary" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
function SignOutButton({ children = "Sign out", iconSize = 16 }) {
  const { logout } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function confirmSignOut() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    setConfirming(false);
  }

  return (
    <>
      <Button secondary onClick={() => setConfirming(true)}>
        <LogOut size={iconSize} />
        {children}
      </Button>
      {confirming && (
        <Modal
          title="Sign out?"
          className="signout-modal"
          close={() => !signingOut && setConfirming(false)}
        >
          <div className="signout-confirmation">
            <span className="signout-confirmation-icon">
              <LogOut size={22} />
            </span>
            <div>
              <h3>Are you sure you want to sign out?</h3>
              <p>You’ll need to sign in again to access your EveeRide account.</p>
            </div>
          </div>
          <div className="signout-confirmation-actions">
            <Button
              secondary
              disabled={signingOut}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button disabled={signingOut} onClick={confirmSignOut}>
              {signingOut ? <LoaderCircle size={16} className="spin" /> : <LogOut size={16} />}
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Empty({
  title = "Nothing here yet",
  text = "Your records will appear here as you get started.",
  to,
  label,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Layers size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {to && (
        <Link className="text-link" to={to}>
          {label || "Explore plans"} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
function Card({ children, className = "" }) {
  return <section className={"card " + className}>{children}</section>;
}
function ErrorState({ loading, error }) {
  return loading ? (
    <div className="loading skeleton" aria-busy="true">
      <LoaderCircle className="spin" size={20} />
      Loading records…
    </div>
  ) : error ? (
    <div className="error-box">{error}</div>
  ) : null;
}
function MoneyStat({ icon: Icon, label, value, description }) {
  return (
    <Card className="stat">
      <span className="stat-icon">
        <Icon size={20} />
      </span>
      <span className="stat-label">{label}</span>
      <strong>{rupees(value)}</strong>
      <small>{description}</small>
    </Card>
  );
}
const WHATSAPP_CHANNEL =
    "https://whatsapp.com/channel/0029VbEJyKw2975BrU2C0a3E",
  WHATSAPP_SUPPORT = "https://wa.me/92333456789",
  SUPPORT_EMAIL = "eveerideofficial@gmail.com";
const UPCOMING_PLAN_UNLOCK_AT = Date.parse("2026-11-10T23:59:59+05:00");
function WhatsAppChannel({ promo = false }) {
  return (
    <a
      className="whatsapp-channel"
      href={WHATSAPP_CHANNEL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the official EveeRide WhatsApp channel"
    >
      <span className="whatsapp-channel-icon">
        <MessageCircle size={27} />
        <i />
      </span>
      <span className="whatsapp-channel-copy">
        <small>OFFICIAL EVEERIDE CHANNEL</small>
        <strong>
          {promo
            ? "Join WhatsApp channel for promo codes"
            : "Join our official WhatsApp channel"}
        </strong>
        <span>
          {promo
            ? "Get new promo codes and reward updates in one place."
            : "Get announcements, updates and promo drops."}
        </span>
      </span>
      <span className="whatsapp-channel-action">
        Join now <ArrowUpRight size={18} />
      </span>
    </a>
  );
}
function UpcomingPlan({ compact = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, UPCOMING_PLAN_UNLOCK_AT - now),
    unlocked = remaining === 0,
    days = Math.floor(remaining / 86400000),
    hours = Math.floor(remaining / 3600000) % 24,
    minutes = Math.floor(remaining / 60000) % 60,
    seconds = Math.floor(remaining / 1000) % 60;
  return (
    <section className={`upcoming-plan${compact ? " compact" : ""}`}>
      <div className="upcoming-plan-icon">
        {unlocked ? <Layers size={27} /> : <Lock size={25} />}
      </div>
      <div className="upcoming-plan-copy">
        <span className="eyebrow">UPCOMING PLAN</span>
        <h2>EveeRide Pulse</h2>
        <p>
          {unlocked
            ? "Plan details are now unlocked. Full launch information will appear here."
            : "A new EveeRide experience is on the way. Pricing, duration and rewards stay locked until launch."}
        </p>
      </div>
      <div className="upcoming-plan-status">
        <span className={`upcoming-plan-lock${unlocked ? " unlocked" : ""}`}>
          {unlocked ? "Details unlocked" : "Unlocks in"}
        </span>
        {!unlocked && (
          <div className="countdown-grid" aria-label={`${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`}>
            {[
              [days, "Days"],
              [hours, "Hours"],
              [minutes, "Min"],
              [seconds, "Sec"],
            ].map(([value, label]) => (
              <span key={label}>
                <b>{String(value).padStart(2, "0")}</b>
                <small>{label}</small>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
function LaunchAnnouncement({ user }) {
  const storageKey = `eveeride.launch-announcement.seen:${user?.id}`;
  const [open, setOpen] = useState(
    () => Boolean(user?.id) && sessionStorage.getItem(storageKey) !== "1",
  );

  function dismiss() {
    sessionStorage.setItem(storageKey, "1");
    setOpen(false);
  }

  if (!open) return null;
  return (
    <Modal title="EveeRide launch" className="launch-modal" close={dismiss}>
      <div className="launch-announcement-hero">
        <span className="launch-announcement-badge">
          <TrendingUp size={15} /> Official launch announcement
        </span>
        <h2>Smart tasks. Better growth.</h2>
        <p>
          EveeRide is launching with daily tasks, transparent earnings and a
          simple way to track your progress.
        </p>
      </div>
      <div className="launch-announcement-grid">
        <div>
          <span><Clock size={18} /></span>
          <small>Launching date</small>
          <strong>10 November 2026</strong>
        </div>
        <div>
          <span><ArrowDownLeft size={18} /></span>
          <small>Minimum deposit</small>
          <strong>510 PKR</strong>
        </div>
        <div>
          <span><ArrowUpRight size={18} /></span>
          <small>Minimum withdrawal</small>
          <strong>100 PKR</strong>
        </div>
        <div>
          <span><Gift size={18} /></span>
          <small>Member benefits</small>
          <strong>Daily tasks & earnings</strong>
        </div>
      </div>
      <a
        className="launch-channel-button"
        href={WHATSAPP_CHANNEL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={20} />
        <span>
          <small>OFFICIAL WHATSAPP CHANNEL</small>
          <strong>Join for announcements and updates</strong>
        </span>
        <ArrowUpRight size={18} />
      </a>
      <Button className="launch-continue" onClick={dismiss}>
        Continue to dashboard <ArrowRight size={17} />
      </Button>
    </Modal>
  );
}
function Dashboard() {
  const { user } = useApp(),
    { data: d, loading, error } = useData("/dashboard", blank, 10000),
    [balanceVisible, setBalanceVisible] = useState(true);
  return (
    <>
      <LaunchAnnouncement user={user} />
      <PageTitle
        title={
          user
            ? `Welcome back, ${user.name.split(" ")[0]}`
            : "Your next chapter starts here."
        }
        description="A clear view of your tasks, team and rewards."
      >
        <span className="date-chip">
          <Clock size={15} />
          {new Date().toLocaleDateString("en-PK", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Karachi",
          })}
        </span>
      </PageTitle>
      <ErrorState loading={loading} error={error} />
      <div className="hero-grid">
        <section className="balance-card">
          <div className="balance-top">
            <span>
              <span className="wallet-mark">
                <Wallet size={17} />
              </span>
              Total available balance
            </span>
            <button
              type="button"
              className="balance-visibility"
              onClick={() => setBalanceVisible((visible) => !visible)}
              aria-label={balanceVisible ? "Hide balances" : "Show balances"}
              title={balanceVisible ? "Hide balances" : "Show balances"}
            >
              {balanceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className={`balance-number${balanceVisible ? "" : " concealed"}`}>
            {balanceVisible ? rupees(d.available) : "••••••"}
          </div>
          <div className="balance-breakdown">
            <div>
              <span>Withdrawable</span>
              <b className={balanceVisible ? "" : "concealed"}>
                {balanceVisible ? rupees(d.withdrawable) : "••••••"}
              </b>
            </div>
          </div>
          <div className="balance-foot">
            <ShieldCheck size={15} />
            Balances are confirmed by your transaction ledger
          </div>
          <div className="orb orb-one" />
          <div className="orb orb-two" />
        </section>
        <Card className="quick-actions">
          <div className="section-head">
            <h2>Quick actions</h2>
            <span className="muted small">Keep things moving</span>
          </div>
          <div className="action-grid">
            {[
              ["/deposit", "Deposit", Download],
              ["/withdraw", "Withdraw", Upload],
              ["/team", "My team", UsersRound],
              ["/support", "Support", Headphones],
            ].map(([to, n, I, sub]) => (
              <Link to={to} key={to}>
                <span>
                  <I size={23} />
                </span>
                <b>{n}</b>
                <small>{sub}</small>
              </Link>
            ))}
          </div>
        </Card>
      </div>
      <div className="stat-grid">
        <MoneyStat
          icon={Play}
          label="Task earnings"
          value={d.totals.task_earning}
         
        />
        <MoneyStat
          icon={Users}
          label="Referral rewards"
          value={
            (d.totals.team_commission || 0) +
            (d.totals.team_task_commission || 0)
          }
          
        />
        <MoneyStat
          icon={Crown}
          label="Salary bonuses"
          value={d.totals.salary_bonus}
         
        />
      </div>
      <WhatsAppChannel />
      <Card>
        <div className="section-head">
          <div>
            <h2>Recent activity</h2>
            <p>A record of every movement.</p>
          </div>
          <Link to="/activity" className="text-link">
            View history <ChevronRight size={16} />
          </Link>
        </div>
        <TransactionList items={d.recent} />
      </Card>
    </>
  );
}
function Plans({ owned = false }) {
  const { data, loading, error } = useData("/plans", {
      plan: {
        price: 51000,
        reward: 3400,
        dailyTasks: 1,
        days: 35,
        maxPurchases: 3,
      },
      purchases: [],
      subscribers: 0,
    }),
    { pub, action } = useApp();
  const plan = data.plan || pub?.plan || {
    price: 51000,
    reward: 3400,
    dailyTasks: 1,
    days: 35,
    maxPurchases: 3,
  };
  const [confirm, setConfirm] = useState(false),
    [buying, setBuying] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="CHOOSE YOUR NEXT STEP"
        title={owned ? "My product" : "A simple plan. A clear routine."}
        description="Understand the details before you start."
      />
      <ErrorState loading={loading} error={error} />
      {owned ? (
        <Card>
          {data.purchases.length ? (
            data.purchases.map((p) => (
              <div className="list-row" key={p._id}>
                <Layers />
                <div>
                  <b>
                    {p.name} · #{p.sequence}
                  </b>
                  <small>
                    {when(p.start)} → {when(p.expires)}
                  </small>
                </div>
                <Tag>
                  {new Date(p.expires) > new Date() ? "Active" : "Expired"}
                </Tag>
              </div>
            ))
          ) : (
            <Empty title="No plans purchased" to="/plans" />
          )}
        </Card>
      ) : (
        <div className="plan-layout">
          <div className="plan-primary-column">
            <Card className="plan-card">
              <div className="plan-header">
                <span className="square-icon">
                  <Layers size={27} />
                </span>
                <Tag>STARTER SERIES</Tag>
              </div>
              <h2>EveeRide</h2>
              <p>Start with one daily task.</p>
              <div className="plan-price">
                {(plan.price / 100).toLocaleString("en-PK")} PKR
                <span>/ {plan.days} days</span>
              </div>
              <div className="plan-details">
                {[
                  ["Daily tasks", `${plan.dailyTasks} per day`],
                  ["Reward per completed task", rupees(plan.reward)],
                  ["Plan duration", `${plan.days} days`],
                  ["Total eligible tasks", String(plan.dailyTasks * plan.days)],
                  ["Total possible task rewards", rupees(plan.reward * plan.dailyTasks * plan.days)],
                  ["Maximum purchases", `${plan.maxPurchases} per account`],
                ].map(([a, b]) => (
                  <div key={a}>
                    <span>{a}</span>
                    <b>{b}</b>
                  </div>
                ))}
              </div>
              <div className="purchase-meter">
                <span>Your purchase count</span>
                <b>{data.purchases.length}/{plan.maxPurchases} purchases</b>
              </div>
              <Button
                disabled={data.purchases.length >= plan.maxPurchases}
                onClick={() => setConfirm(true)}
              >
                {data.purchases.length >= plan.maxPurchases
                  ? "Purchase limit reached"
                  : "Activate Starter Plan"}
                <ArrowRight size={17} />
              </Button>
              <small className="center muted">
                {data.subscribers} verified plan purchaser
                {data.subscribers !== 1 ? "s" : ""}
              </small>
            </Card>
            <UpcomingPlan />
            <div className="plan-update-note" lang="ur" dir="rtl">
              <span className="plan-update-note-icon">
                <Plus size={19} />
              </span>
              <div>
                <small>نئے پلان کی تازہ کاری</small>
                <strong>ہر 10 دن بعد ایک نیا پلان شامل کیا جائے گا۔</strong>
              </div>
            </div>
          </div>
          <div>
            <Card>
              <ShieldCheck className="cyan" size={30} />
              <h2>Know what you’re choosing.</h2>
              <p>
                Complete eligible tasks on schedule and track each confirmed
                reward in your transaction history.
              </p>
              <ul className="clean-list">
                <li>
                  <Check size={17} />
                  Each purchase has a separate {plan.days}-day schedule.
                </li>
                <li>
                  <Check size={17} />
                  One eligible daily task per active plan.
                </li>
                <li>
                  <Check size={17} />
                  Rewards post after backend validation.
                </li>
                <li>
                  <Check size={17} />
                  Promotional balance unlocks with paid eligibility.
                </li>
              </ul>
              <Link to="/terms" className="text-link">
                Read the terms <ArrowRight size={15} />
              </Link>
            </Card>
            <Card className="soft-card">
              <h3>Need to add balance?</h3>
              <p>
                Minimum deposit: Rs 510. Deposits require manual verification.
              </p>
              <Link to="/deposit" className="text-link">
                Go to deposit <ArrowRight size={15} />
              </Link>
            </Card>
          </div>
        </div>
      )}
      {confirm && (
        <Modal title="Activate Starter Plan?" close={() => setConfirm(false)}>
          <p>
            {rupees(plan.price)} will be deducted from your available balance.{" "}
            The plan lasts {plan.days} days and includes {plan.dailyTasks} eligible
            daily {plan.dailyTasks === 1 ? "task" : "tasks"}.
          </p>
          <Button
            disabled={buying}
            onClick={async () => {
              setBuying(true);
              await action(() =>
                api.post("/plans/purchase", { requestId: crypto.randomUUID() }),
              );
              setBuying(false);
              setConfirm(false);
            }}
          >
            Confirm activation
          </Button>
        </Modal>
      )}
    </>
  );
}
function Modal({ title, close, children, className = "" }) {
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className={`modal card ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-head">
          <h2>{title}</h2>
          <button
            onClick={close}
            className="icon-btn"
            aria-label="Close dialog"
          >
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Tasks() {
  const { data, loading, error } = useData("/tasks", []),
    { action, tell } = useApp(),
    [started, setStarted] = useState({}),
    [urls, setUrls] = useState({});
  useEffect(
    () => () => Object.values(urls).forEach(URL.revokeObjectURL),
    [urls],
  );
  function NextTaskCountdown({ unlockAt }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
      const timer = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(timer);
    }, []);
    const seconds = Math.max(
        0,
        Math.ceil((Date.parse(unlockAt) - now) / 1000),
      ),
      hours = Math.floor(seconds / 3600),
      minutes = Math.floor(seconds / 60) % 60,
      remainder = seconds % 60;
    return (
      <div className="next-task-timer" role="timer" aria-live="off">
        <Clock size={17} />
        <span>
          <small>{seconds ? "Next task in" : "Next task"}</small>
          <b>
            {seconds
              ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
              : "Ready now"}
          </b>
        </span>
      </div>
    );
  }
  async function start(t) {
    const r = await action(() => api.post(`/tasks/${t._id}/start`));
    if (r) {
      try {
        const video = await api.get(`/files/tasks/${t.task._id}`, {
          responseType: "blob",
          timeout: 120000,
        });
        if (!video.data.size || !video.data.type.startsWith("video/"))
          throw new Error("The server did not return a video file.");
        setUrls((x) => ({ ...x, [t._id]: URL.createObjectURL(video.data) }));
        setStarted((x) => ({ ...x, [t._id]: true }));
      } catch (error) {
        const status = error.response?.status;
        tell(
          status === 404
            ? "This task video is missing. Please ask the administrator to upload it again."
            : status === 403
              ? "You are not authorized to watch this task video."
              : "Video could not be loaded. Please try again.",
          true,
        );
      }
    }
  }
  return (
    <>
      <PageTitle
        title="A little progress, every day."
        eyebrow="TASK CENTER"
        description="One eligible task for each active plan. Rewards are confirmed by the server."
      />
      <div className="info-strip">
        <ShieldCheck size={18} />
        Complete the full task to qualify. The server records your start time
        and validates completion before posting the reward.
      </div>
      <ErrorState loading={loading} error={error} />
      <div className="task-grid">
        {data.map((t, i) => (
          <Card key={t._id}>
            <div className="section-head">
              <Tag>TASK {i + 1}</Tag>
              <Tag>{t.completed ? "Completed" : "Available"}</Tag>
            </div>
            {urls[t._id] ? (
              <video controls playsInline src={urls[t._id]} />
            ) : (
              <div className="video-placeholder">
                <img
                  src="/images/video-task-cover.png"
                  alt="Video task ready to watch"
                />
              </div>
            )}
            <h2>{t.task.title}</h2>
            <p>
              10 seconds · {rupees(t.reward)} reward
            </p>
            {t.completed && <NextTaskCountdown unlockAt={t.expires} />}
            {!t.completed && (
              <div className="button-row">
                <Button secondary onClick={() => start(t)}>
                  Start task
                </Button>
                <Button
                  disabled={!started[t._id]}
                  onClick={() =>
                    action(() => api.post(`/tasks/${t._id}/complete`))
                  }
                >
                  Complete task
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {!data.length && !loading && (
        <Card>
          <Empty
            title="No eligible tasks right now"
            text="Tasks appear when you have an active plan and an administrator has uploaded a video."
            to="/plans"
          />
        </Card>
      )}
    </>
  );
}
function Field({ label, children, ...props }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = !children && props.type === "password";
  return (
    <label className="field">
      <span>{label}</span>
      {children || (isPassword ? (
        <span className="password-input-wrap">
          <input
            {...props}
            type={passwordVisible ? "text" : "password"}
          />
          <button
            type="button"
            className="password-visibility"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? `Hide ${label}` : `Show ${label}`}
            title={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      ) : <input {...props} />)}
    </label>
  );
}
function Submit({ children = "Save", busy = false, disabled = false }) {
  return (
    <Button type="submit" disabled={busy || disabled}>
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
      <ArrowRight size={16} />
    </Button>
  );
}
function useHours() {
  const { pub } = useApp();
  const [state, setState] = useState(null);
  useEffect(() => {
    if (!pub) return;
    const offset = Date.parse(pub.serverTime) - Date.now();
    function tick() {
      const h = Number(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          hourCycle: "h23",
        }).format(new Date(Date.now() + offset)),
      );
      setState(h >= 8 && h < 17);
    }
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [pub]);
  return state;
}
function Deposit() {
  const { data: p, error } = useData("/payments", { methods: {} }),
    { action, tell } = useApp(),
    [order, setOrder] = useState(null),
    [now, setNow] = useState(Date.now()),
    [busy, setBusy] = useState(false);
  async function copyPayment(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      tell(`${label} copied`);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      tell(copied ? `${label} copied` : "Could not copy this value.", !copied);
    }
  }
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.target);
    if (!order) {
      const r = await action(() =>
        api.post("/deposits/order", Object.fromEntries(f)),
      );
      if (r?.order)
        setOrder({ ...r, offset: Date.parse(r.serverTime) - Date.now() });
    } else {
      const r = await action(() =>
        api.post(`/deposits/${order.order._id}/submit`, f),
      );
      if (r) setOrder(null);
    }
    setBusy(false);
  }
  const seconds = order
    ? Math.max(
        0,
        Math.floor(
          (Date.parse(order.order.expires) - now - order.offset) / 1000,
        ),
      )
    : 0;
  return (
    <>
      <PageTitle
        title="Add to your balance."
        eyebrow="DEPOSIT"
        description="Transfer first. Submit proof. Receive credit after verification."
      />
      <div className="form-layout">
        <Card>
          <h2>{order ? "Payment instructions" : "New deposit"}</h2>
          <ErrorState error={error} />
          <form onSubmit={submit}>
            {!order ? (
              <>
                <Field
                  label="Deposit amount (PKR)"
                  name="amount"
                  type="number"
                  min="510"
                  step="0.01"
                  required
                  placeholder="510.00"
                />
                <Field label="Payment method">
                  <select name="method" required>
                    <option value="">Select a method</option>
                    {[
                      ["EasyPaisa", "EasyPaisa"],
                      ["JazzCash", "JazzCash"],
                      ["Mashreq", "Bank Account"],
                    ].map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                        {!p.methods[value] ? " · not configured" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="muted small">Minimum deposit is Rs 510.00</p>
                <Submit busy={busy}>
                  Proceed to payment
                </Submit>
              </>
            ) : (
              <>
                <div className="payment-countdown">
                  <Clock size={20} />
                  {Math.floor(seconds / 60)}:
                  {String(seconds % 60).padStart(2, "0")} remaining
                </div>
                <dl className="details">
                  {[
                    ["Order amount", rupees(order.order.amount), false],
                    [
                      "Payment method",
                      order.order.method === "Mashreq"
                        ? "Bank Account"
                        : order.order.method,
                      false,
                    ],
                    ["Account title", order.account.title, true],
                    ["Account number / IBAN", order.account.number, true],
                    ["Bank", order.account.bank || "—", false],
                  ].map(([a, b, canCopy]) => (
                    <div key={a}>
                      <dt>{a}</dt>
                      <dd>
                        <span>{b}</span>
                        {canCopy && (
                          <button
                            type="button"
                            className="detail-copy"
                            onClick={() => copyPayment(String(b), a)}
                            aria-label={`Copy ${a}`}
                            title={`Copy ${a}`}
                          >
                            <Copy size={15} />
                            Copy
                          </button>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Field
                  label="Transaction ID (TID)"
                  name="tid"
                  minLength={6}
                  maxLength={80}
                  required
                />
                <Field
                  label="Payment screenshot (JPG, PNG, WebP · max 5 MB)"
                  name="screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required
                />
                <Submit busy={busy} disabled={seconds === 0}>
                  Confirm deposit
                </Submit>
                <Button secondary onClick={() => setOrder(null)}>
                  Back
                </Button>
              </>
            )}
          </form>
        </Card>
        <div>
          <Card className="soft-card">
            <h3>Verification comes first.</h3>
            <p>
              Transfer only to the account shown on your payment order. Your
              request stays pending until an administrator reviews the
              transaction ID and proof.
            </p>
            <p>
              An expired order stays in the audit history. A submitted request
              does not mean a deposit has been approved.
            </p>
            <Link to="/activity" className="text-link">
              Track your request <ArrowRight size={15} />
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
function Withdraw() {
  const open = useHours();
  const { data: d } = useData("/dashboard", blank),
    { data: a } = useData("/payout-account", null),
    { action } = useApp(),
    [edit, setEdit] = useState(false),
    [type, setType] = useState("EasyPaisa");
  const save = async (e) => {
    e.preventDefault();
    if (
      await action(() =>
        api.put("/payout-account", Object.fromEntries(new FormData(e.target))),
      )
    )
      setEdit(false);
  };
  return (
    <>
      <PageTitle
        title="Your rewards. Your payout."
        eyebrow="WITHDRAWAL"
        description="Submit a request and follow its status through to payment."
      />
      <div className="form-layout">
        <Card>
          <div className="withdraw-balance">
            <span>Withdrawable balance</span>
            <strong>{rupees(d.withdrawable)}</strong>
          </div>
          {!a || edit ? (
            <form onSubmit={save}>
              <h2>Bind your payout account</h2>
              <Field label="Account holder name" name="holder" required />
              <Field label="Wallet type">
                <select
                  name="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {["EasyPaisa", "JazzCash", "Bank Account"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Account number / IBAN"
                name="number"
                minLength={10}
                required
              />
              {type === "Bank Account" && (
                <Field label="Bank name" name="bank" required />
              )}
              <Field
                label="Confirm with your password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              <Submit>Save payout account</Submit>
            </form>
          ) : (
            <>
              <div className="bound-account">
                <ShieldCheck size={22} />
                <div>
                  <b>
                    {a.holder} · {a.type}
                  </b>
                  <small>
                    {a.number} {a.bank}
                  </small>
                </div>
                <button className="text-link" onClick={() => setEdit(true)}>
                  Update
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await action(() =>
                    api.post(
                      "/withdrawals",
                      Object.fromEntries(new FormData(e.target)),
                    ),
                  );
                }}
              >
                <Field
                  label="Withdrawal amount (PKR)"
                  name="amount"
                  type="number"
                  min="100"
                  step="0.01"
                  required
                  placeholder="100.00"
                />
                <Submit disabled={open === false}>
                  Submit withdrawal request
                </Submit>
              </form>
            </>
          )}
        </Card>
        <div>
          <Card>
            <h2>Clear payout rules</h2>
            <ul className="rules">
              <li>
                An active paid plan is required. A free plan does not qualify.
              </li>
              <li>
                Minimum withdrawal: Rs 100. Tax: 0%, where legally applicable.
              </li>
              <li>Processing target: within 24 hours.</li>
              <li>Only one pending or approved unpaid request at a time.</li>
              <li>Requested funds are reserved until paid or rejected.</li>
              <li>Submitted, approved and paid are separate statuses.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
function Team() {
  const { data, loading, error } = useData("/team", {
      members: [],
      levels: [0, 0, 0, 0],
    }),
    { user, pub, tell } = useApp(),
    depositCommissionRates = pub?.commissions?.deposit || [7, 3, 2, 2],
    teamEarningRate = pub?.commissions?.teamEarning?.[0] || 4;
  return (
    <>
      <PageTitle
        title="Grow together. Track it clearly."
        eyebrow="MY TEAM"
        description="Your first four referral levels, backed by real activity."
      />
      <ErrorState loading={loading} error={error} />
      <div className="team-invite">
        <span className="square-icon">
          <Users />
        </span>
        <div className="team-invite-copy">
          <h2>A good place to start is an invitation.</h2>
          <p>Share your unique link and build your team.</p>
          {data.referralUrl && (
            <div className="invitation-url">{data.referralUrl}</div>
          )}
        </div>
        <Button
          onClick={async () => {
            if (!data.referralUrl) {
              tell("Sign in to get your invitation link.", true);
              return;
            }
            try {
              await navigator.clipboard.writeText(data.referralUrl);
              tell("Referral link copied");
            } catch {
              tell(data.referralUrl);
            }
          }}
        >
          <Copy size={17} />
          Copy invitation link
        </Button>
      </div>
      <div className="commission-policy-grid">
        <Card className="commission-policy-card">
          <div className="commission-policy-head">
            <span className="square-icon"><ArrowDownLeft size={19} /></span>
            <div>
              <span className="eyebrow">DEPOSIT COMMISSION</span>
              <h2>Earn across four team levels</h2>
            </div>
          </div>
          <div className="commission-rate-list">
            {depositCommissionRates.map((rate, index) => (
              <div key={index}>
                <span>Level {index + 1}</span>
                <strong>{rate}%</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card className="commission-policy-card">
          <div className="commission-policy-head">
            <span className="square-icon"><UsersRound size={19} /></span>
            <div>
              <span className="eyebrow">TEAM EARNING COMMISSION</span>
              <h2>Direct team earnings</h2>
            </div>
          </div>
          <div className="commission-rate-list single">
            <div>
              <span>Level 1</span>
              <strong>{teamEarningRate}%</strong>
            </div>
          </div>
          <p className="commission-policy-note">
            Applies to eligible earnings from your direct team.
          </p>
        </Card>
      </div>
      <div className="stat-grid four">
        {[
          ["Team members", data.members.length, false],
          ["Team deposits", data.deposits, true],
          ["Team earnings", data.earnings, true],
          ["Team commissions", data.commissions, true],
          ["Team withdrawals", data.withdrawals, true],
          ["Salary bonuses", data.salary, true],
          ["Team activity", data.revenue, true],
          ["Pending rewards", data.pendingRewards, true],
        ].map(([n, v, m]) => (
          <Card className="compact-stat" key={n}>
            <span>{n}</span>
            <strong>{m ? rupees(v) : v}</strong>
          </Card>
        ))}
      </div>
      <div className="level-grid">
        {data.levels.map((n, i) => (
          <Card key={i}>
            <span className="eyebrow">LEVEL {i + 1}</span>
            <h2>
              {n} <small>members</small>
            </h2>
            <p>
              {i ? "Invited through level " + i : "Your direct invitations"}
            </p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="section-head">
          <h2>Your team members</h2>
          <Tag>4 REFERRAL LEVELS</Tag>
        </div>
        {data.members.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Total deposit</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m, i) => (
                  <tr key={i}>
                    <td>{m.name}</td>
                    <td>Level {m.level}</td>
                    <td>{rupees(m.deposits)}</td>
                    <td>{when(m.joined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Your team starts with you"
            text="Your first referral will appear here after registration."
          />
        )}
      </Card>
    </>
  );
}
function countdown(date, now) {
  if (!date) return "Not yet qualified";
  const seconds = Math.max(0, Math.floor((Date.parse(date) - now) / 1000));
  return `${Math.floor(seconds / 86400)}d ${Math.floor(seconds / 3600) % 24}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`;
}
function Salary() {
  const fallback = {
      total: 0,
      cycleEndsAt: null,
      states: [],
      levels: [
        [5000, 500],
        [10000, 1000],
        [20000, 1500],
        [30000, 2000],
        [40000, 2500],
        [50000, 3000],
        [60000, 3500],
        [70000, 4000],
        [85000, 4500],
        [100000, 5000],
      ].map(([t, b], i) => ({ level: i + 1, target: t * 100, bonus: b * 100 })),
    },
    { data, error } = useData("/salary", fallback),
    { action } = useApp(),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (data.serverTime) setOffset(Date.parse(data.serverTime) - Date.now());
  }, [data.serverTime]);
  return (
    <>
      <PageTitle
        title="Every milestone deserves a moment."
        eyebrow="SALARY REWARDS"
        description="Ten repeatable levels. Each cycle counts new approved team deposits for ten days, then resets."
      />
      <div className="info-strip salary-cycle-summary">
        <span className="salary-cycle-icon">
          <Crown size={20} />
        </span>
        <div className="salary-cycle-metric">
          <small>Current cycle progress</small>
          <b>{rupees(data.total)}</b>
        </div>
        <div className="salary-cycle-metric">
          <small>Cycle ends in</small>
          <b>{countdown(data.cycleEndsAt, now + offset)}</b>
        </div>
        <p>Approved deposits from up to four referral levels are included.</p>
      </div>
      <ErrorState error={error} />
      <div className="salary-grid">
        {data.levels.map((l) => {
          const s = data.states.find((s) => s.level === l.level),
            progress = Math.min(100, (data.total / l.target) * 100);
          return (
            <Card className="salary-card" key={l.level}>
              <div className="section-head">
                <span className="crown-icon">
                  <Crown size={27} />
                </span>
                <Tag>LEVEL {String(l.level).padStart(2, "0")}</Tag>
              </div>
              <p>One-time performance bonus</p>
              <h2>{rupees(l.bonus)}</h2>
              <div className="target-line">
                <span>Team target</span>
                <b>{rupees(l.target)}</b>
              </div>
              <div className="task-track">
                <span style={{ width: progress + "%" }} />
              </div>
              <div className="progress-label">
                <span>{progress.toFixed(1)}% complete</span>
                <span>
                  {rupees(Math.max(0, l.target - data.total))} remaining
                </span>
              </div>
              <div className="salary-timer">
                <Clock size={15} />
                {s?.claimedAt
                  ? "Claimed on " + when(s.claimedAt)
                  : s
                    ? countdown(s.claimAfter, now + offset)
                    : `Cycle ends in ${countdown(data.cycleEndsAt, now + offset)}`}
              </div>
              <Button
                secondary
                disabled={
                  !s || !!s.claimedAt || Date.parse(s.claimAfter) > now + offset
                }
                onClick={() =>
                  action(() => api.post(`/salary/${l.level}/claim`))
                }
              >
                {s?.claimedAt
                  ? "Reward claimed"
                  : s
                    ? "Claim salary"
                    : "Reach target to qualify"}
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
function Promo() {
  const { action } = useApp();
  return (
    <>
      <PageTitle
        title="A little extra, when it’s available."
        eyebrow="PROMO REWARDS"
        description="Claim an active code with an eligible paid plan."
      />
      <WhatsAppChannel promo />
      <Card className="promo-card">
        <span className="promo-icon">
          <Gift size={45} />
        </span>
        <h2>Have a reward code?</h2>
        <p>
          Enter it below. Eligibility, expiry and the available budget are
          checked securely on the server.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            action(() =>
              api.post(
                "/promos/claim",
                Object.fromEntries(new FormData(e.target)),
              ),
            );
          }}
        >
          <Field
            label="Promo code"
            name="code"
            required
            minLength={2}
            maxLength={40}
            placeholder="Enter your code"
          />
          <Submit>Claim reward</Submit>
        </form>
        <small className="muted">
          Each account can claim an eligible promo code once while claims remain.
        </small>
      </Card>
    </>
  );
}
function TransactionList({ items = [] }) {
  if (!items.length)
    return (
      <Empty
        title="A fresh start"
        text="Your confirmed transactions will appear here."
      />
    );
  return (
    <div className="transaction-list">
      {items.map((t) => (
        <div className="list-row" key={t._id}>
          <span className={"transaction-icon " + (t.amount < 0 ? "out" : "")}>
            <>
              {t.amount < 0 ? (
                <ArrowUpRight size={19} />
              ) : (
                <ArrowDownLeft size={19} />
              )}
            </>
          </span>
          <div>
            <b>{t.description}</b>
            <small>
              {when(t.createdAt)} · {t.category.replaceAll("_", " ")}
            </small>
            <small className="mono">{t._id}</small>
          </div>
          <div className="transaction-amount">
            <b className={t.amount < 0 ? "negative" : "positive"}>
              {t.amount > 0 ? "+" : ""}
              {rupees(t.amount)}
            </b>
            <small>{t.status}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
const categories = [
  "deposit",
  "withdrawal",
  "withdrawal_reservation",
  "task_earning",
  "team_commission",
  "team_task_commission",
  "promo_reward",
  "salary_bonus",
  "registration_bonus",
  "adjustment",
];
function Activity({ admin = false }) {
  const [filter, setFilter] = useState(""),
    [p, setP] = useState(1),
    { data, error, loading } = useData(
      `${admin ? "/admin" : ""}/transactions?page=${p}${filter}`,
      { items: [], total: 0 },
    );
  return (
    <>
      <PageTitle
        title={<>Every movement, accounted&nbsp;for.</>}
        eyebrow="TRANSACTIONS"
        description="Your immutable transaction ledger, all in one place."
      />
      <Card>
        <form
          className="filter-bar activity-filter"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new URLSearchParams();
            for (const [k, v] of new FormData(e.target)) if (v) q.set(k, v);
            setFilter("&" + q);
            setP(1);
          }}
        >
          <input
            aria-label="Search transactions"
            name="search"
            placeholder="Search description or reference"
          />
          {admin && (
            <input name="user" placeholder="User ID" aria-label="User ID" />
          )}
          <select aria-label="Category" name="category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input type="date" name="from" aria-label="From date" />
          <input type="date" name="to" aria-label="To date" />
          <select name="status" aria-label="Status">
            <option value="">Any status</option>
            <option>completed</option>
          </select>
          <Button type="submit" secondary>
            <Search size={16} />
            Filter
          </Button>
        </form>
        <ErrorState error={error} loading={loading} />
        <TransactionList items={data.items} />
        <div className="pagination">
          <span>
            {data.total} records · Page {p}
          </span>
          <Button secondary disabled={p === 1} onClick={() => setP(p - 1)}>
            Previous
          </Button>
          <Button
            secondary
            disabled={p * 20 >= data.total}
            onClick={() => setP(p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
    </>
  );
}
function Account() {
  const { user, action, login, impersonating, updateUser } = useApp(),
    [editingPassword, setEditingPassword] = useState(false),
    [savingPassword, setSavingPassword] = useState(false),
    [savingAvatar, setSavingAvatar] = useState(false);
  async function changeAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    setSavingAvatar(true);
    const result = await action(() => api.post("/account/avatar", form));
    if (result?.user) updateUser(result.user);
    setSavingAvatar(false);
    e.target.value = "";
  }
  async function changePassword(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setSavingPassword(true);
    const result = await action(() =>
      api.post(
        "/account/password",
        Object.fromEntries(new FormData(form)),
      ),
    );
    if (result?.token) {
      await login(result);
      form.reset();
      setEditingPassword(false);
    }
    setSavingPassword(false);
  }
  return (
    <>
      <PageTitle title="Your account, at a glance." eyebrow="ACCOUNT" />
      <Card>
        {user ? (
          <>
            <div className="profile">
              <div className="profile-photo-control">
                <ProfileAvatar user={user} large />
                {!impersonating && (
                  <label className="profile-photo-button">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={changeAvatar}
                      disabled={savingAvatar}
                    />
                    <Camera size={14} />
                    {savingAvatar
                      ? "Uploading…"
                      : user.avatarVersion
                        ? "Change photo"
                        : "Add photo"}
                  </label>
                )}
              </div>
              <div>
                <h2>{user.name}</h2>
                <p>@{user.username}</p>
              </div>
            </div>
            <dl className="details">
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Referral code</dt>
                <dd>{user.referralCode}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{user.status}</dd>
              </div>
            </dl>
            {!impersonating && (
              <section className="account-security">
                <div className="account-security-head">
                  <span className="square-icon">
                    <Lock size={19} />
                  </span>
                  <div>
                    <h3>Password & security</h3>
                    <p>Use a strong, unique password for your EveeRide account.</p>
                  </div>
                  <Button
                    secondary
                    onClick={() => setEditingPassword((value) => !value)}
                  >
                    {editingPassword ? "Cancel" : "Edit password"}
                  </Button>
                </div>
                {editingPassword && (
                  <form className="password-form" onSubmit={changePassword}>
                    <Field
                      label="Old password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      required
                    />
                    <div className="password-form-grid">
                      <Field
                        label="New password"
                        name="newPassword"
                        type="password"
                        minLength={10}
                        maxLength={100}
                        autoComplete="new-password"
                        required
                      />
                      <Field
                        label="Confirm new password"
                        name="confirmPassword"
                        type="password"
                        minLength={10}
                        maxLength={100}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <small className="muted">
                      Use at least 10 characters with uppercase, lowercase and a number.
                    </small>
                    <Submit busy={savingPassword}>Save password</Submit>
                  </form>
                )}
              </section>
            )}
            <div className="button-row">
              <SignOutButton />
              {user.role === "admin" && (
                <Link className="btn" to="/admin">
                  Open admin
                </Link>
              )}
            </div>
          </>
        ) : (
          <Empty
            title="Make this workspace yours"
            text="Create an account or sign in to see your profile and balance."
            to="/login"
            label="Sign in"
          />
        )}
      </Card>
    </>
  );
}
function Notifications() {
  const { data, error } = useData("/notifications", []),
    { action, user } = useApp();
  return (
    <>
      <PageTitle title="Your latest updates." eyebrow="NOTIFICATIONS" />
      <ErrorState error={error} />
      <Card>
        {data.length ? (
          data.map((n) => (
            <div key={n._id} className="notification-row">
              <Bell size={20} />
              <div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{when(n.createdAt)}</small>
              </div>
              {notificationIsRead(n, user?.id) ? (
                <span className="notification-read-status">
                  <Check size={15} /> Read
                </span>
              ) : (
                <Button
                  secondary
                  onClick={() =>
                    action(() => api.post(`/notifications/${n._id}/read`))
                  }
                >
                  Mark read
                </Button>
              )}
            </div>
          ))
        ) : (
          <Empty
            title="You’re all caught up"
            text="Account updates and announcements will appear here."
          />
        )}
      </Card>
    </>
  );
}
function Support() {
  return (
    <>
      <PageTitle
        title="EveeRide Support"
        eyebrow="HELP & SUPPORT"
        description="Contact our team, follow official updates, and keep your account secure."
      />
      <div className="support-contact-grid">
        <section className="support-contact-card customer-service-card">
          <span className="support-contact-icon">
            <Headphones size={28} />
          </span>
          <span className="eyebrow">CUSTOMER SERVICE</span>
          <h2>Talk to EveeRide Support</h2>
          <p>
            Get help with your account, deposits, withdrawals, plans, or tasks
            through our official support number.
          </p>
          <a
            className="support-action"
            href={WHATSAPP_SUPPORT}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} />
            Contact customer service
            <ExternalLink size={15} />
          </a>
          <a className="support-email" href={`mailto:${SUPPORT_EMAIL}`}>
            <Mail size={16} />
            {SUPPORT_EMAIL}
          </a>
        </section>
        <section className="support-contact-card official-channel-card">
          <span className="support-contact-icon">
            <MessageCircle size={28} />
          </span>
          <span className="eyebrow">OFFICIAL WHATSAPP CHANNEL</span>
          <h2>Announcements, promo codes and updates</h2>
          <p>
            Follow the official EveeRide channel for platform news, new promo
            codes, service notices, and important updates.
          </p>
          <a
            className="support-action"
            href={WHATSAPP_CHANNEL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} />
            Join channel
            <ExternalLink size={15} />
          </a>
        </section>
      </div>
      <div className="support-trust-note">
        <ShieldCheck size={22} />
        <div>
          <b>Stay safe</b>
          <p>
            Only trust messages from the official channel, customer-service
            number, and support email shown on this page. EveeRide support will
            never ask for your password or password-reset link.
          </p>
        </div>
      </div>
    </>
  );
}
function Legal({ privacy = false }) {
  return (
    <>
      <PageTitle
        title={privacy ? "Privacy policy" : "Terms & conditions"}
        eyebrow="PLATFORM INFORMATION"
        description="Review the rules, account protections and service information."
      />
      <Card className="legal">
        {privacy ? (
          <>
            <h2>Information collected</h2>
            <p>
              We store account identity, password hashes, referral
              relationships, plan and task activity, transaction records, payout
              details and uploaded payment evidence. Payout details are
              encrypted at rest. Passwords are never available to
              administrators.
            </p>
            <h2>Purpose and access</h2>
            <p>
              Data supports account access, rewards, payment verification, fraud
              prevention and dispute handling. Administrators may use
              time-limited, audited read-only support access. Email is processed
              by the configured SMTP provider.
            </p>
            <h2>Retention and your rights</h2>
            <p>
              Account and transaction records are retained for security,
              support, and dispute handling. Account suspension preserves
              historical records. Contact support to request access, correction,
              or eligible deletion. Do not upload unrelated personal information.
            </p>
          </>
        ) : (
          <>
            <h2>Accounts and eligibility</h2>
            <p>
              Provide accurate information and keep your login secure. Duplicate
              accounts, false payment evidence, automated task abuse and
              referral manipulation are prohibited. Accounts may be suspended;
              historical records are preserved.
            </p>
            <h2>Plans and task rewards</h2>
            <p>
              The Starter Plan costs Rs 510, lasts 35 days, and offers one
              eligible task per day per plan with a maximum of three purchases.
              A completed eligible task has a configured reward of Rs 34.00.
              Completed tasks are validated by the server before rewards are
              added to the account.
            </p>
            <h2>Referral and bonus rules</h2>
            <p>
              Four referral levels are tracked. Eligible approved deposits pay
              7%, 3%, 2%, and 2% across levels one through four. Eligible direct
              team earnings pay 4% at level one. Team activity also updates
              milestone progress. Ten team-performance bonuses use repeatable
              ten-day cycles.
            </p>
            <h2>Deposits and withdrawals</h2>
            <p>
              Minimum deposit: Rs 510. Transfers require proof and manual
              approval. Minimum withdrawal: Rs 100. An active paid plan and
              bound payout account are required. The registration bonus of Rs 20
              is non-withdrawable until paid-plan eligibility. Only one pending
              withdrawal is allowed. No tax is deducted where legally
              applicable. Processing target is 24 hours; submission is not proof
              of payment.
            </p>
            <h2>Operating hours</h2>
            <p>
              Withdrawals are accepted from 8:00 AM until 5:00 PM Asia/Karachi,
              enforced by the server. Financial operations are preserved in an
              immutable ledger. Expired orders remain auditable.
            </p>
            <h2>Support and disputes</h2>
            <p>
              Contact support with your transaction ID and a clear description
              of the issue. Never share your password or password-reset link.
            </p>
          </>
        )}
        <Link to={privacy ? "/terms" : "/privacy"} className="text-link">
          {privacy ? "Terms & conditions" : "Privacy policy"}
          <ArrowRight size={15} />
        </Link>
      </Card>
    </>
  );
}
function Auth({ register = false, admin = false }) {
  const { login, tell, user } = useApp(),
    navigate = useNavigate(),
    [busy, setBusy] = useState(false);
  const ref = new URLSearchParams(useLocation().search).get("ref") || "";
  if (ref && !register && !admin) {
    return (
      <Navigate
        to={`/register?ref=${encodeURIComponent(ref)}`}
        replace
      />
    );
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const b = Object.fromEntries(new FormData(e.target));
    if (register) b.terms = b.terms === "on";
    try {
      const r = await api.post(register ? "/auth/register" : "/auth/login", b);
      if (!r.data.token || !r.data.user?.id)
        throw new Error("The API endpoint is not configured correctly.");
      if (admin && r.data.user.role !== "admin")
        throw new Error("Super Admin access required");
      await login(r.data);
      navigate(admin ? "/admin" : "/");
    } catch (e) {
      tell(
        e.response?.data?.message ||
          e.message ||
          "Could not connect to the backend.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div>
          <div className="eyebrow">YOUR PROGRESS, IN PERSPECTIVE</div>
          <h1>
            Small tasks.
            <br />
            Clear milestones.
            <br />
            <span>A new routine.</span>
          </h1>
          <p>
            A workspace that puts your plans, team and rewards in one place.
          </p>
          <div className="auth-art">
            <Layers size={100} strokeWidth={1} />
          </div>
          <div className="auth-trust">
            <ShieldCheck size={20} />
            Transparent records. Secure access.
          </div>
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="eyebrow">
          {admin ? "SUPER ADMIN" : "WELCOME TO EVEERIDE"}
        </div>
        <h1>
          {register
            ? "Start your next chapter."
            : admin
              ? "Admin sign in."
              : "Good to see you again."}
        </h1>
        <p>
          {register
            ? "Create your account to explore the platform."
            : "Enter your details to open your workspace."}
        </p>
        <form onSubmit={submit}>
          {register && (
            <>
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
              <Field
                label="Username"
                name="username"
                autoComplete="username"
                pattern="[A-Za-z0-9_]{3,30}"
                required
              />
            </>
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={register ? 10 : 1}
            maxLength={100}
            autoComplete={register ? "new-password" : "current-password"}
            required
          />
          {register && (
            <>
              <small className="muted">
                Use at least 10 characters with uppercase, lowercase and a
                number.
              </small>
              <Field
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
              <Field
                label="Referral code (optional)"
                name="referralCode"
                defaultValue={ref}
              />
              <label className="checkbox">
                <input type="checkbox" name="terms" required />I agree to the{" "}
                <Link to="/terms">Terms & Conditions</Link>
              </label>
            </>
          )}
          {!register && !admin && (
            <Link to="/forgot" className="text-link forgot">
              Forgot password?
            </Link>
          )}
          <Submit busy={busy}>{register ? "Create account" : "Sign in"}</Submit>
        </form>
        {!admin && (
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to EveeRide?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        )}
        <div className="auth-foot">
          <Lock size={14} /> Your account details stay protected.
        </div>
      </section>
    </div>
  );
}
function Reset() {
  const { tell } = useApp(),
    [busy, setBusy] = useState(false),
    [otpSent, setOtpSent] = useState(false),
    [otpCooldown, setOtpCooldown] = useState(0),
    [email, setEmail] = useState(""),
    navigate = useNavigate();
  useEffect(() => {
    if (!otpSent || otpCooldown <= 0) return;
    const timer = setInterval(
      () => setOtpCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [otpSent, otpCooldown]);
  async function requestOtp() {
    const response = await api.post("/auth/forgot", { email });
    tell(response.data.message);
    setOtpSent(true);
    setOtpCooldown(60);
  }
  async function resendOtp() {
    setBusy(true);
    try {
      await requestOtp();
    } catch (error) {
      tell(
        error.response?.data?.message || "Could not send a new OTP.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      if (!otpSent) {
        await requestOtp();
      } else {
        const response = await api.post("/auth/reset", { ...body, email });
        tell(response.data.message);
        navigate("/login", { replace: true });
      }
    } catch (error) {
      tell(
        error.response?.data?.message || "Could not connect to the backend.",
        true,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reset-page">
      <Brand />
      <Card>
        <span className="square-icon">
          <Mail />
        </span>
        <h1>{otpSent ? "Enter your OTP." : "Forgot your password?"}</h1>
        <p>
          {otpSent
            ? `Enter the six-digit code sent to ${email}, then choose a new password.`
            : "Enter your registered email address and we’ll send you a six-digit OTP."}
        </p>
        <form onSubmit={submit}>
          {!otpSent ? (
            <Field
              label="Email address"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          ) : (
            <>
              <Field
                label="OTP"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                required
              />
              <Field
                label="New password"
                name="password"
                type="password"
                minLength={10}
                maxLength={100}
                autoComplete="new-password"
                required
              />
              <Field
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                minLength={10}
                maxLength={100}
                autoComplete="new-password"
                required
              />
              <small className="muted">
                The OTP expires after 10 minutes. Use at least 10 characters
                with uppercase, lowercase and a number.
              </small>
              <div className="otp-resend-row" aria-live="polite">
                {otpCooldown > 0 ? (
                  <span>
                    Resend OTP in {String(Math.floor(otpCooldown / 60)).padStart(2, "0")}:
                    {String(otpCooldown % 60).padStart(2, "0")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={busy}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
          <Submit busy={busy}>{otpSent ? "Change password" : "Get OTP"}</Submit>
        </form>
        {otpSent && (
          <button
            type="button"
            className="text-link reset-change-email"
            onClick={() => {
              setOtpSent(false);
              setOtpCooldown(0);
            }}
          >
            Change email address
          </button>
        )}
        <Link className="text-link" to="/login">
          Back to sign in
        </Link>
      </Card>
    </div>
  );
}
const adminNav = [
  ["", "Dashboard", LayoutDashboard],
  ["users", "Users", Users],
  ["deposits", "Deposits", ArrowDownLeft],
  ["withdrawals", "Withdrawals", ArrowUpRight],
  ["promos", "Promo codes", Ticket],
  ["payments", "Payment settings", Settings],
  ["announcements", "Notifications", Bell],
  ["transactions", "Transactions", Receipt],
];
function Admin() {
  const { user, ready } = useApp(),
    [menu, setMenu] = useState(false),
    location = useLocation();
  useEffect(() => setMenu(false), [location.pathname]);
  if (!ready) return <div className="loading">Checking session…</div>;
  if (!user) return <Navigate to="/admin/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-brand">
          <button
            className="admin-menu-toggle icon-btn"
            onClick={() => setMenu(!menu)}
            aria-label="Open admin navigation"
            aria-expanded={menu}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Brand />
        </div>
        <div className="admin-header-actions">
          <div className="admin-identity">
            <span>{user.name}</span>
            <small>Administrator</small>
          </div>
          <SignOutButton iconSize={17}>Logout</SignOutButton>
        </div>
      </header>
      <div className="admin-layout">
        {menu && (
          <button
            className="admin-sidebar-overlay"
            onClick={() => setMenu(false)}
            aria-label="Close admin navigation"
          />
        )}
        <aside className={`admin-sidebar${menu ? " open" : ""}`}>
          <div className="admin-sidebar-title">
            <span className="square-icon"><ShieldCheck size={20} /></span>
            <div>
              <b>Admin panel</b>
              <small>Management workspace</small>
            </div>
          </div>
          <div className="eyebrow">NAVIGATION</div>
          <nav>
            {adminNav.map(([p, n, I]) => (
              <NavLink key={p} end to={"/admin" + (p ? "/" + p : "")}>
                <I size={18} />
                {n}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="admin-main">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="deposits" element={<AdminRequests />} />
            <Route path="withdrawals" element={<AdminRequests withdrawal />} />
            <Route path="promos" element={<AdminPromos />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="transactions" element={<Activity admin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
function AdminDashboard() {
  const { data: d, error } = useData("/admin/dashboard", {}),
    chartData = d.activity?.length
      ? d.activity
      : [
          {
            date: "all-time",
            label: "All time",
            registrations: d.users || 0,
            deposits: d.approvedDeposits || 0,
            withdrawals: d.approvedWithdrawals || 0,
          },
        ];
  return (
    <>
      <PageTitle
        title="Platform overview"
        eyebrow="SUPER ADMIN"
        description="Monitor accounts, requests, rewards and platform activity."
      />
      <ErrorState error={error} />
      <div className="stat-grid four">
        {[
          ["Registered users", d.users, "/admin/users"],
          ["Active accounts", d.activeUsers],
          ["Active paid plans", d.activePlans],
          ["Pending deposits", d.pendingDeposits, "/admin/deposits"],
          ["Approved deposits", rupees(d.approvedDeposits), "/admin/deposits"],
          ["Pending withdrawals", d.pendingWithdrawals, "/admin/withdrawals"],
          ["Approved withdrawals", rupees(d.approvedWithdrawals), "/admin/withdrawals"],
          ["Task rewards", rupees(d.taskRewards)],
          ["Commissions", rupees(d.commissions)],
        ].map(([n, v, to]) => {
          const content = (
            <Card className={`compact-stat${to ? " clickable-stat" : ""}`}>
              <span>{n}</span>
              <strong>{v ?? "—"}</strong>
              {to && <ChevronRight className="stat-arrow" size={18} />}
            </Card>
          );
          return to ? (
            <Link className="stat-link" to={to} key={n}>
              {content}
            </Link>
          ) : (
            <React.Fragment key={n}>{content}</React.Fragment>
          );
        })}
      </div>
      <div className="admin-chart-grid">
        <AdminRegistrationChart data={chartData} />
        <AdminFundsChart data={chartData} />
      </div>
      <Card>
        <h2>Task video upload</h2>
        <p>Upload the MP4 video users must complete for the assigned task.</p>
        <p className="muted">
          To start clean, type DELETE below to remove all previous task videos
          and assignments before uploading a new video.
        </p>
        <ApiForm
          endpoint="/admin/videos"
          method="delete"
          fields={[["confirmation", "Type DELETE to remove all previous videos"]]}
          label="Delete all previous videos"
        />
        <ApiForm
          endpoint="/admin/videos"
          multipart
          fields={[
            ["title", "Video title"],
            ["duration", "Minimum duration (seconds)", "number"],
            ["video", "MP4 video · max 50 MB", "file"],
          ]}
          label="Upload video"
        />
      </Card>
    </>
  );
}
function AdminRegistrationChart({ data }) {
  const values = data.map((day) => day.registrations),
    maximum = Math.max(1, ...values),
    pointX = (index) =>
      values.length === 1 ? 300 : 32 + index * (536 / (values.length - 1)),
    points = values
      .map((value, index) => {
        const x = pointX(index),
          y = 164 - (value / maximum) * 116;
        return `${x},${y}`;
      })
      .join(" "),
    total = values.reduce((sum, value) => sum + value, 0),
    period = data[0]?.date === "all-time" ? "ALL-TIME TOTAL" : "LAST 7 DAYS";
  return (
    <Card className="admin-chart-card">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{period}</span>
          <h2>User registrations</h2>
        </div>
        <strong>{total}</strong>
      </div>
      <div className="chart-canvas">
        <svg viewBox="0 0 600 205" role="img" aria-label="Daily user registrations">
          {[48, 106, 164].map((y) => (
            <line key={y} className="chart-grid-line" x1="32" x2="568" y1={y} y2={y} />
          ))}
          {points && <polyline className="registration-line" points={points} />}
          {values.map((value, index) => {
            const x = pointX(index),
              y = 164 - (value / maximum) * 116;
            return <circle key={data[index].date} className="registration-dot" cx={x} cy={y} r="5"><title>{data[index].label}: {value} registrations</title></circle>;
          })}
        </svg>
        <div className="chart-labels" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
          {data.map((day) => <span key={day.date}>{day.label}</span>)}
        </div>
      </div>
    </Card>
  );
}
function AdminFundsChart({ data }) {
  const maximum = Math.max(1, ...data.flatMap((day) => [day.deposits, day.withdrawals])),
    depositTotal = data.reduce((sum, day) => sum + day.deposits, 0),
    withdrawalTotal = data.reduce((sum, day) => sum + day.withdrawals, 0),
    period = data[0]?.date === "all-time" ? "ALL-TIME TOTAL" : "LAST 7 DAYS";
  return (
    <Card className="admin-chart-card">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">{period}</span>
          <h2>Approved cash activity</h2>
        </div>
        <div className="chart-legend">
          <span><i className="deposit-key" />Deposits {rupees(depositTotal)}</span>
          <span><i className="withdrawal-key" />Withdrawals {rupees(withdrawalTotal)}</span>
        </div>
      </div>
      <div
        className="bar-chart"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(40px, 1fr))` }}
        role="img"
        aria-label="Approved deposits and withdrawals"
      >
        {data.map((day) => (
          <div className="bar-day" key={day.date}>
            <div className="bar-pair">
              <i className="deposit-bar" style={{ height: `${Math.max(3, (day.deposits / maximum) * 100)}%` }} title={`${day.label} deposits: ${rupees(day.deposits)}`} />
              <i className="withdrawal-bar" style={{ height: `${Math.max(3, (day.withdrawals / maximum) * 100)}%` }} title={`${day.label} withdrawals: ${rupees(day.withdrawals)}`} />
            </div>
            <span>{day.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
function ApiForm({
  endpoint,
  fields,
  label = "Save",
  multipart = false,
  method = "post",
  transform,
  done,
}) {
  const { action } = useApp(),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.target);
        let b = multipart ? f : Object.fromEntries(f);
        if (transform) b = transform(b);
        const r = await action(() =>
          method === "delete"
            ? api.delete(endpoint, { data: b })
            : api[method](endpoint, b),
        );
        if (r) {
          e.target.reset();
          done?.(r);
        }
        setBusy(false);
      }}
    >
      {fields.map(([name, l, type = "text", values]) => (
        <Field key={name} label={l}>
          {type === "select" ? (
            <select required name={name}>
              {values.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          ) : (
            <input
              required={!l.includes("(optional)")}
              name={name}
              type={type}
              step={type === "number" ? "0.01" : undefined}
              accept={type === "file" ? "video/mp4" : undefined}
            />
          )}
        </Field>
      ))}
      <Submit busy={busy}>{label}</Submit>
    </form>
  );
}
function AdminUsers() {
  const [query, setQuery] = useState(""),
    [p, setP] = useState(1),
    [operation, setOperation] = useState(null),
    { data, error } = useData(
      "/admin/users?page=" + p + "&search=" + encodeURIComponent(query),
      { items: [], total: 0 },
    ),
    { action, startImpersonation } = useApp(),
    navigate = useNavigate();
  async function accessUser(u) {
    const session = await action(() =>
      api.post(`/admin/users/${u._id}/impersonate`),
    );
    if (session && (await startImpersonation(session))) navigate("/");
  }
  async function submitOperation(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    if (operation.type === "delete") {
      const result = await action(() =>
        api.delete(`/admin/users/${operation.user._id}`, { data: form }),
      );
      if (result) setOperation(null);
      return;
    }
    const result = await action(() =>
      api.post(`/admin/users/${operation.user._id}/adjust`, {
        ...form,
        type: operation.type,
        requestId: crypto.randomUUID(),
      }),
    );
    if (result) setOperation(null);
  }
  return (
    <>
      <PageTitle title="User management" />
      <Card>
        <form
          className="filter-bar"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(new FormData(e.target).get("search"));
            setP(1);
          }}
        >
          <input
            name="search"
            placeholder="Search name, email or username"
            aria-label="Search users"
          />
          <Submit>Search</Submit>
        </form>
        <ErrorState error={error} />
        <div className="table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u._id}>
                  <td data-label="User">
                    <b>{u.name}</b>
                    <small>{u.email}</small>
                    <small className="mono">{u._id}</small>
                  </td>
                  <td data-label="Status">{u.status}</td>
                  <td data-label="Registered">{when(u.createdAt)}</td>
                  <td data-label="Balance">
                    {rupees(
                      (u.wallet.deposit || 0) +
                        (u.wallet.earned || 0) +
                        (u.wallet.promo || 0),
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className="admin-user-actions">
                      <Button
                        secondary
                        disabled={u.role === "admin" || u.status !== "active"}
                        onClick={() => accessUser(u)}
                      >
                        <LogIn size={15} />
                        {u.role === "admin" ? "Admin" : "Login"}
                      </Button>
                      <Button
                        secondary
                        disabled={u.role === "admin" || u.status === "deleted"}
                        onClick={() => setOperation({ type: "credit", user: u })}
                      >
                        <Plus size={15} /> Add Balance
                      </Button>
                      <Button
                        secondary
                        disabled={u.role === "admin" || u.status === "deleted"}
                        onClick={() => setOperation({ type: "debit", user: u })}
                      >
                        <Minus size={15} /> Remove Balance
                      </Button>
                      <Button
                        className="btn danger"
                        disabled={u.role === "admin" || u.status === "deleted"}
                        onClick={() => setOperation({ type: "delete", user: u })}
                      >
                        <Trash2 size={15} /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>{data.total} users</span>
          <Button secondary disabled={p === 1} onClick={() => setP(p - 1)}>
            Previous
          </Button>
          <Button
            secondary
            disabled={p * 20 >= data.total}
            onClick={() => setP(p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
      {operation && (
        <Modal
          title={
            operation.type === "credit"
              ? `Add balance — ${operation.user.name}`
              : operation.type === "debit"
                ? `Remove balance — ${operation.user.name}`
                : `Delete account — ${operation.user.name}`
          }
          close={() => setOperation(null)}
        >
          <form onSubmit={submitOperation}>
            {operation.type === "delete" ? (
              <>
                <p>
                  The account must have a zero balance and no open payment
                  requests. Financial and audit records will be retained.
                </p>
                <Field
                  label="Type DELETE to confirm"
                  name="confirmation"
                  required
                  pattern="DELETE"
                  autoComplete="off"
                />
              </>
            ) : (
              <Field
                label="Amount (PKR)"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
              />
            )}
            <Field label="Reason" name="reason" minLength="5" required />
            <Submit>
              {operation.type === "credit"
                ? "Add balance"
                : operation.type === "debit"
                  ? "Remove balance"
                  : "Delete account"}
            </Submit>
          </form>
        </Modal>
      )}
    </>
  );
}
function AdminRequests({ withdrawal = false }) {
  const endpoint = "/admin/" + (withdrawal ? "withdrawals" : "deposits"),
    { data, error } = useData(endpoint, []),
    [statusFilter, setStatusFilter] = useState("pending"),
    [record, setRecord] = useState(null),
    [proof, setProof] = useState(null),
    { action, tell } = useApp();
  const requestStatuses = ["pending", "approved", "rejected"],
    visibleRequests =
      statusFilter === "all"
        ? data
        : data.filter((request) => request.status === statusFilter);
  async function copyAccountNumber(value) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      tell("Account number copied");
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();
      tell(copied ? "Account number copied" : "Could not copy account number.", !copied);
    }
  }
  useEffect(
    () => () => {
      if (proof) URL.revokeObjectURL(proof);
    },
    [proof],
  );
  useEffect(() => {
    setStatusFilter("pending");
    setRecord(null);
    setProof(null);
  }, [withdrawal]);
  return (
    <>
      <PageTitle
        title={withdrawal ? "Withdrawal management" : "Deposit management"}
        description={
          withdrawal
            ? "Send the funds, then approve the request with its payment reference."
            : "Verify the payment account, transaction ID and evidence before crediting."
        }
      />
      <ErrorState error={error} />
      <div className="request-tabs" role="tablist" aria-label="Request status">
        {requestStatuses.map((status) => {
          const count =
            status === "all"
              ? data.length
              : data.filter((request) => request.status === status).length;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === status}
              className={statusFilter === status ? "active" : ""}
              onClick={() => {
                setStatusFilter(status);
                setRecord(null);
                setProof(null);
              }}
              key={status}
            >
              {status[0].toUpperCase() + status.slice(1)}
              <span>{count}</span>
            </button>
          );
        })}
      </div>
      <Card>
        {visibleRequests.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  {withdrawal && (
                    <>
                      <th>Account name</th>
                      <th>Account type</th>
                      <th>Account number</th>
                    </>
                  )}
                  <th>Reference</th>
                  <th className="date-cell">Date</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((d) => (
                  <tr key={d._id}>
                    <td>{d.user?.email}</td>
                    <td>{rupees(d.amount)}</td>
                    <td>
                      <Tag>{d.status}</Tag>
                    </td>
                    {withdrawal && (
                      <>
                        <td>{d.account?.holder || "—"}</td>
                        <td>{d.account?.type || "—"}</td>
                        <td>
                          <div className="account-number-cell">
                            <span className="mono">{d.account?.number || "—"}</span>
                            {d.account?.number && (
                              <button
                                type="button"
                                className="detail-copy"
                                onClick={() => copyAccountNumber(d.account.number)}
                                aria-label="Copy account number"
                                title="Copy account number"
                              >
                                <Copy size={14} />
                                Copy
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    <td>{d.tid || d.paymentRef || "—"}</td>
                    <td className="date-cell">{when(d.createdAt)}</td>
                    <td>
                      <Button
                        secondary
                        onClick={() => {
                          setRecord(d);
                          setProof(null);
                        }}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={`No ${statusFilter === "all" ? "" : statusFilter + " "}${
              withdrawal ? "withdrawals" : "deposits"
            }`}
          />
        )}
      </Card>
      {record && (
        <Modal
          title="Request review"
          close={() => {
            setRecord(null);
            setProof(null);
          }}
        >
          <p>
            {record.user?.email} · {rupees(record.amount)} · {record.status}
          </p>
          {withdrawal ? (
            <dl className="details">
              <div>
                <dt>Account holder name</dt>
                <dd>{record.account?.holder || "—"}</dd>
              </div>
              <div>
                <dt>Account type</dt>
                <dd>{record.account?.type || "—"}</dd>
              </div>
              <div>
                <dt>Account number / IBAN</dt>
                <dd>
                  <span className="mono">{record.account?.number || "—"}</span>
                  {record.account?.number && (
                    <button
                      type="button"
                      className="detail-copy"
                      onClick={() => copyAccountNumber(record.account.number)}
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  )}
                </dd>
              </div>
              {record.account?.bank && (
                <div>
                  <dt>Bank name</dt>
                  <dd>{record.account.bank}</dd>
                </div>
              )}
            </dl>
          ) : (
            <>
              <p>
                {record.method} · TID: {record.tid || "Not submitted"}
              </p>
              {record.file && (
                <Button
                  secondary
                  onClick={async () => {
                    try {
                      const r = await api.get(
                        `${endpoint}/${record._id}/proof`,
                        { responseType: "blob" },
                      );
                      setProof(URL.createObjectURL(r.data));
                    } catch {
                      tell("Could not load proof.", true);
                    }
                  }}
                >
                  Open payment screenshot
                </Button>
              )}
              {proof && (
                <img
                  className="proof-image"
                  src={proof}
                  alt="Submitted payment evidence"
                />
              )}
            </>
          )}
          {record.status === "pending" && (
            <ApiForm
              endpoint={`${endpoint}/${record._id}/decision`}
              fields={[
                [
                  "status",
                  "Decision",
                  "select",
                  ["approved", "rejected"],
                ],
                ["reason", "Decision reason"],
              ]}
              label="Record decision"
              done={() => setRecord(null)}
            />
          )}
        </Modal>
      )}
    </>
  );
}
function AdminPromos() {
  const { data, error } = useData("/admin/promos", []),
    { action } = useApp(),
    [claims, setClaims] = useState(null);
  return (
    <>
      <PageTitle title="Promo codes" />
      <div className="form-layout">
        <Card>
          <h2>Create a promotion</h2>
          <ApiForm
            endpoint="/admin/promos"
            fields={[
              ["code", "Unique code"],
              ["budget", "Total budget (PKR)", "number"],
              ["maxClaims", "Maximum claims", "number"],
              ["starts", "Starts", "datetime-local"],
              ["expires", "Expires", "datetime-local"],
            ]}
            label="Create promo"
          />
        </Card>
        <Card>
          <ErrorState error={error} />
          {data.length ? (
            data.map((p) => (
              <div className="promo-row" key={p._id}>
                <b>{p.code}</b>
                <p>
                  {rupees(p.reward)} per claim · {p.claims}/{p.maxClaims} claims
                </p>
                <div className="button-row">
                  <Button
                    secondary
                    onClick={() =>
                      action(() =>
                        api.patch("/admin/promos/" + p._id, {
                          active: !p.active,
                        }),
                      )
                    }
                  >
                    {p.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    secondary
                    onClick={async () => {
                      const c = await action(() =>
                        api.get("/admin/promos/" + p._id + "/claims"),
                      );
                      if (c) setClaims(c);
                    }}
                  >
                    Claim history
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <Empty title="No promotions yet" />
          )}
        </Card>
      </div>
      {claims && (
        <Modal title="Promo claim history" close={() => setClaims(null)}>
          {claims.length ? (
            claims.map((c) => (
              <p key={c._id}>
                {c.user?.email} · {rupees(c.amount)} · {when(c.createdAt)}
              </p>
            ))
          ) : (
            <Empty title="No claims yet" />
          )}
        </Modal>
      )}
    </>
  );
}
function AdminPayments() {
  const { data, error } = useData("/admin/payments", {}),
    { action } = useApp();
  return (
    <>
      <PageTitle
        title="Payment settings"
        description="Configure the payment accounts shown in deposit orders."
      />
      <ErrorState error={error} />
      <Card>
        <form
          key={JSON.stringify(data)}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.target),
              v = {};
            for (const m of ["EasyPaisa", "JazzCash", "Mashreq"])
              v[m] = {
                title: f.get(m + "title"),
                number: f.get(m + "number"),
                bank: f.get(m + "bank"),
                enabled: f.get(m + "enabled") === "on",
              };
            action(() => api.put("/admin/payments", v));
          }}
        >
          {["EasyPaisa", "JazzCash", "Mashreq"].map((m) => (
            <fieldset key={m}>
              <legend>{m}</legend>
              <Field
                label="Account title"
                name={m + "title"}
                defaultValue={data[m]?.title}
              />
              <Field
                label="Account number / IBAN"
                name={m + "number"}
                defaultValue={data[m]?.number}
              />
              <Field
                label="Bank name"
                name={m + "bank"}
                defaultValue={data[m]?.bank}
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  name={m + "enabled"}
                  defaultChecked={data[m]?.enabled}
                />
                Enable verified account
              </label>
            </fieldset>
          ))}
          <Submit>Save payment settings</Submit>
        </form>
      </Card>
    </>
  );
}
function AdminAnnouncements() {
  const { data } = useData("/admin/notifications", []);
  return (
    <>
      <PageTitle title="Notifications" />
      <div className="content-grid">
        <Card>
          <h2>Create announcement</h2>
          <ApiForm
            endpoint="/admin/notifications"
            fields={[
              ["title", "Title"],
              ["message", "Message"],
              ["audience", "Audience", "select", ["all", "user"]],
              ["user", "User ID (optional)"],
            ]}
            transform={(b) =>
              b.audience === "all"
                ? { title: b.title, message: b.message, audience: "all" }
                : b
            }
            label="Publish announcement"
          />
        </Card>
        <Card>
          <h2>Announcement history</h2>
          {data.length ? (
            data.map((n) => (
              <div className="promo-row" key={n._id}>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{when(n.createdAt)}</small>
              </div>
            ))
          ) : (
            <Empty title="No announcements yet" />
          )}
        </Card>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
