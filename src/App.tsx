import React, { useState, useEffect, useCallback } from "react";
import {
  useAuth,
  withAuthErrorHandling,
} from "./contexts/AuthContext.tsx";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Activity,
  Syringe,
  Pill,
  HeartPulse,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Droplets,
  Wind,
  Stethoscope,
  Star,
  Home,
  ClipboardList,
  Wallet,
  Bell,
  LogOut,
  Menu,
  Upload,
  Calendar,
  MapPin,
  CheckSquare,
  Square,
  X,
  BriefcaseMedical,
  Image as ImageIcon,
  FileText,
  Lock,
  Shield,
  Check,
  FileCheck,
  History,
  Clock,
  Settings,
} from "lucide-react";

type View =
  | "landing"
  | "patient_reg"
  | "patient_login"
  | "nurse_reg"
  | "nurse_login"
  | "patient_services"
  | "full_care"
  | "summary"
  | "success"
  | "nurse_dashboard"
  | "admin_login"
  | "admin_dashboard"
  | "patient_dashboard";

interface ServiceDef {
  id: string;
  name: string;
  price: number;
  icon: any;
}

const INITIAL_SERVICES: ServiceDef[] = [
  { id: "s1", name: "تركيب محاليل", price: 150, icon: Droplets },
  { id: "s2", name: "رعاية جرح", price: 100, icon: Activity },
  { id: "s3", name: "قياس ضغط وسكر", price: 80, icon: HeartPulse },
  { id: "s4", name: "تغيير على قسطرة", price: 120, icon: Stethoscope },
  { id: "s5", name: "حقن عضل", price: 60, icon: Syringe },
  { id: "s6", name: "حقن وريد", price: 100, icon: Syringe },
  { id: "s7", name: "بخار", price: 100, icon: Wind },
  { id: "s8", name: "وضع سوندا", price: 150, icon: User },
];

type Order = {
  id: string;
  services: string[];
  total: number;
  date: string;
  status: "pending" | "accepted" | "cancelled" | "completed";
  cancellationFeeApplied?: number;
  rating?: number;
};

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: "#1256",
    services: ["رعاية جرح"],
    total: 100,
    date: "18 مايو 2024",
    status: "pending",
  },
  {
    id: "#1257",
    services: ["تركيب محاليل"],
    total: 150,
    date: "20 مايو 2024",
    status: "pending",
  },
  {
    id: "#1258",
    services: ["قياس ضغط وسكر"],
    total: 80,
    date: "22 مايو 2024",
    status: "pending",
  },
];

type NurseRequest = {
  id: string;
  name: string;
  phone: string;
  date: string;
  status: "pending" | "approved" | "rejected";
};

const INITIAL_NURSE_REQUESTS: NurseRequest[] = [
  {
    id: "NR-001",
    name: "سارة أحمد",
    phone: "01012345678",
    date: "28 أبريل 2026",
    status: "pending",
  },
  {
    id: "NR-002",
    name: "عمر محمود",
    phone: "01123456789",
    date: "27 أبريل 2026",
    status: "pending",
  },
  {
    id: "NR-003",
    name: "محمد علي",
    phone: "01234567890",
    date: "26 أبريل 2026",
    status: "pending",
  },
];

const CustomEase = [0.22, 1, 0.36, 1];

const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: CustomEase },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.4, ease: CustomEase },
  },
};

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: CustomEase } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: CustomEase } },
};

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [cart, setCart] = useState<ServiceDef[]>([]);
  const [fullCareHours, setFullCareHours] = useState<number>(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [orders, setOrders] = useState<Order[]>(INITIAL_MOCK_ORDERS);
  const [patientOrders, setPatientOrders] =
    useState<Order[]>(INITIAL_MOCK_ORDERS);
  const [nurseTab, setNurseTab] = useState<
    "available" | "active" | "history" | "settings"
  >("available");
  const [adminRequests, setAdminRequests] = useState<NurseRequest[]>(
    INITIAL_NURSE_REQUESTS,
  );
  const [adminTab, setAdminTab] = useState<
    "requests" | "nurses" | "patients" | "settings"
  >("requests");
  const [logoClicks, setLogoClicks] = useState(0);

  // Dynamic Settings
  const [systemSettings, setSystemSettings] = useState({
    transportCost: 50,
    cancellationFee: 50,
  });
  const [servicesList, setServicesList] =
    useState<ServiceDef[]>(INITIAL_SERVICES);

  // Modals & UI States
  const [medicalDisclaimerAccepted, setMedicalDisclaimerAccepted] =
    useState(false);
  const [cancelOrderPrompt, setCancelOrderPrompt] = useState<string | null>(
    null,
  );
  const [selectedAdminNurse, setSelectedAdminNurse] = useState<any>(null);
  const [selectedAdminPatient, setSelectedAdminPatient] = useState<any>(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  const {
    status: authStatus,
    user,
    signUpPatient,
    signUpNurse,
    signInPatient,
    signInNurse,
    signOutUser,
    firebaseConfigured,
  } = useAuth();

  const [patientAuthMessage, setPatientAuthMessage] = useState("");
  const [nurseAuthMessage, setNurseAuthMessage] = useState("");

  // App Level Computed
  const servicesTotal = cart.reduce((acc, s) => acc + s.price, 0);
  const fullCareTotal = fullCareHours > 0 ? fullCareHours * 50 : 0;
  const hasCartItems = cart.length > 0 || fullCareHours > 0;
  const grandTotal =
    servicesTotal +
    fullCareTotal +
    (hasCartItems ? systemSettings.transportCost : 0);

  const navigateTo = (newView: View) => {
    setView(newView);
    window.scrollTo(0, 0);
  };

  const logoutToLanding = useCallback(async () => {
    await signOutUser();
    setView("landing");
    window.scrollTo(0, 0);
  }, [signOutUser]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    const patientViews: View[] = [
      "patient_services",
      "full_care",
      "summary",
      "success",
      "patient_dashboard",
    ];
    const nurseViews: View[] = ["nurse_dashboard"];
    if (!user && patientViews.includes(view)) {
      setView("patient_login");
      return;
    }
    if (!user && nurseViews.includes(view)) {
      setView("nurse_login");
    }
  }, [authStatus, user, view]);

  const handlePatientReg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPatientAuthMessage("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const phone = String(fd.get("phone") ?? "").trim();
    const address = String(fd.get("address") ?? "").trim();
    const displayLabel = String(fd.get("displayName") ?? "").trim();

    const ok = await withAuthErrorHandling(
      () =>
        signUpPatient({
          email,
          password,
          phone,
          address,
          displayLabel: displayLabel || undefined,
        }),
      setPatientAuthMessage,
    );
    if (ok) setShowInstructions(true);
  };

  const handleInstructionsAgree = () => {
    setShowInstructions(false);
    navigateTo("patient_services");
  };

  const handleNurseReg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNurseAuthMessage("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const phone = String(fd.get("phone") ?? "").trim();
    const walletNote = String(fd.get("wallet") ?? "").trim();
    const graduationPlace = String(fd.get("graduationPlace") ?? "").trim();
    const gender = String(fd.get("gender") ?? "male");

    const ok = await withAuthErrorHandling(
      () =>
        signUpNurse({
          email,
          password,
          phone,
          walletNote: walletNote || undefined,
          graduationPlace,
          gender,
        }),
      setNurseAuthMessage,
    );
    if (ok) navigateTo("nurse_dashboard");
  };

  const toggleService = (service: ServiceDef) => {
    if (cart.find((s) => s.id === service.id)) {
      setCart(cart.filter((s) => s.id !== service.id));
    } else {
      setCart([...cart, service]);
    }
  };

  const confirmOrder = () => {
    const newOrder: Order = {
      id: "#" + Math.floor(1000 + Math.random() * 9000),
      services: [
        ...cart.map((c) => c.name),
        ...(fullCareHours > 0 ? [`رعاية كاملة (${fullCareHours} ساعات)`] : []),
      ],
      total: grandTotal,
      date: new Date().toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      status: "pending",
    };
    setOrders([newOrder, ...orders]);
    setPatientOrders([newOrder, ...patientOrders]);
    navigateTo("success");
    // reset cart
    setCart([]);
    setFullCareHours(0);
    setMedicalDisclaimerAccepted(false);
  };

  const handleCancelPatientOrder = (orderId: string) => {
    setPatientOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: "cancelled",
            cancellationFeeApplied: systemSettings.transportCost,
          };
        }
        return o;
      }),
    );
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setCancelOrderPrompt(null);
  };

  const TopBar = ({
    title,
    showBack = true,
    onBack,
  }: {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
  }) => (
    <div className="w-full flex items-center justify-between p-4 md:p-6 bg-white border-b border-slate-100">
      {showBack && (
        <button
          onClick={onBack || (() => navigateTo("landing"))}
          className="text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 p-2 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      {!showBack && <div className="w-10" />}
      {title ? (
        <span className="font-bold text-base md:text-lg text-slate-800">
          {title}
        </span>
      ) : (
        <span className="font-extrabold text-xl text-brand-600">غيث</span>
      )}
      <div className="w-10" />
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center w-full relative font-sans select-none"
      dir="rtl"
    >
      {!firebaseConfigured && (
        <div className="w-full shrink-0 bg-amber-50 text-amber-950 text-sm text-center py-2.5 px-4 border-b border-amber-200 z-[100] leading-relaxed max-w-[100vw]">
          لم يُعرَف Firebase: ضع متغيرات{" "}
          <span className="font-mono font-bold text-xs">VITE_FIREBASE_*</span> في
          ملف{" "}
          <span className="font-mono font-bold">.env.local</span>
          بنسخ القالب من <span className="font-mono font-bold">.env.example</span>{" "}
          داخل<strong> مجلّد المشروع نفسه</strong> حيث تشغّل الأمر ثم أنهِ السيرفر
          بواسطة Ctrl+C وأعد تشغيل <span className="font-mono">npm run dev</span>.
          تنبيه: مستودع Git لا يتضمن <span className="font-mono">.env.local</span>
          بحكم الأمان؛ أضِفه يدويّاً على هذا الجهاز.
        </div>
      )}
      <AnimatePresence mode="wait">
        {view === "landing" && (
          <motion.div
            key="landing"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-16 min-h-screen max-w-6xl mx-auto"
          >
            <div className="text-center mb-10 md:mb-14">
              <div
                className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-brand-100 text-brand-600 rounded-2xl mb-5 shadow-sm cursor-pointer select-none"
                onClick={() => {
                  setLogoClicks((prev) => {
                    const newCount = prev + 1;
                    if (newCount >= 7) {
                      navigateTo("admin_login");
                      return 0;
                    }
                    return newCount;
                  });
                }}
              >
                <Activity className="w-8 h-8 md:w-9 md:h-9" />
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-brand-500 mb-4 drop-shadow-sm tracking-tight select-none">
                غيث
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
                الرعاية الصحية المنزلية الأسهل والأسرع.
                <br />
                <span className="text-slate-400 text-base md:text-lg mt-3 block font-normal">
                  احجز ممرض منزلي متخصص في دقائق معدودة.
                </span>
              </p>
              <div className="flex items-center gap-4 justify-center text-slate-400 font-medium">
                <div className="h-[1px] w-16 md:w-32 bg-slate-200"></div>
                ابدأ الآن كـ
                <div className="h-[1px] w-16 md:w-32 bg-slate-200"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 w-full max-w-3xl mb-8">
              <button
                onClick={() => navigateTo("nurse_login")}
                className="flex flex-col items-center bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-brand-300 transition-all card-hover group"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-50 rounded-full flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-brand-100 transition-all duration-300">
                  <Activity className="w-10 h-10 md:w-11 md:h-11 text-brand-500" />
                </div>
                <span className="font-bold text-lg md:text-xl text-slate-700 group-hover:text-brand-600 transition-colors">
                  مقدم الخدمة (ممرض)
                </span>
              </button>

              <button
                onClick={() => navigateTo("patient_login")}
                className="flex flex-col items-center bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-300 transition-all card-hover group"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-5 group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-300">
                  <User className="w-10 h-10 md:w-11 md:h-11 text-emerald-500" />
                </div>
                <span className="font-bold text-lg md:text-xl text-slate-700 group-hover:text-emerald-600 transition-colors">
                  طالب الخدمة (مريض)
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {view === "patient_login" && (
          <motion.div
            key="patient_login"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <TopBar title="دخول مريض" onBack={() => navigateTo("landing")} />
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPatientAuthMessage("");
                  const fd = new FormData(e.currentTarget);
                  const email = String(fd.get("email") ?? "").trim();
                  const password = String(fd.get("password") ?? "");
                  const ok = await withAuthErrorHandling(
                    () => signInPatient(email, password),
                    setPatientAuthMessage,
                  );
                  if (ok) navigateTo("patient_services");
                }}
                className="p-6 md:p-10 space-y-8"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="البريد الإلكتروني"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="password"
                      required
                      type="password"
                      autoComplete="current-password"
                      placeholder="كلمة المرور"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                {patientAuthMessage ? (
                  <p className="text-red-600 text-sm text-center leading-relaxed">
                    {patientAuthMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={authStatus !== "ready"}
                  className="w-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold py-3 rounded-full text-base shadow-lg shadow-brand-600/25 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none"
                >
                  دخول
                </button>

                <div className="text-center">
                  <span className="text-slate-500">ليس لديك حساب؟ </span>
                  <button
                    type="button"
                    onClick={() => navigateTo("patient_reg")}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    إنشاء حساب جديد
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {view === "patient_reg" && (
          <motion.div
            key="patient_reg"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <TopBar
                title="حساب مريض جديد"
                onBack={() => navigateTo("patient_login")}
              />
              <form
                onSubmit={handlePatientReg}
                className="p-6 md:p-10 space-y-8"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="البريد الإلكتروني"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="displayName"
                      type="text"
                      autoComplete="name"
                      placeholder="الاسم (اختياري)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute right-4 top-3.5 text-slate-400 block w-5 text-center font-bold">
                      📞
                    </span>
                    <input
                      name="phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      placeholder="رقم الهاتف (للتواصل فقط)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="password"
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      placeholder="كلمة المرور (6 أحرف على الأقل)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="address"
                      required
                      placeholder="العنوان بالتفصيل"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                {patientAuthMessage ? (
                  <p className="text-red-600 text-sm text-center leading-relaxed">
                    {patientAuthMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={authStatus !== "ready"}
                  className="w-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold py-3 rounded-full text-base shadow-lg shadow-brand-600/25 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none"
                >
                  التسجيل ومتابعة
                </button>

                <div className="text-center">
                  <span className="text-slate-500">لدي حساب بالفعل؟ </span>
                  <button
                    type="button"
                    onClick={() => navigateTo("patient_login")}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    تسجيل الدخول
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {view === "nurse_login" && (
          <motion.div
            key="nurse_login"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <TopBar
                title="دخول مقدم خدمة"
                onBack={() => navigateTo("landing")}
              />
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setNurseAuthMessage("");
                  const fd = new FormData(e.currentTarget);
                  const email = String(fd.get("email") ?? "").trim();
                  const password = String(fd.get("password") ?? "");
                  const ok = await withAuthErrorHandling(
                    () => signInNurse(email, password),
                    setNurseAuthMessage,
                  );
                  if (ok) navigateTo("nurse_dashboard");
                }}
                className="p-6 md:p-10 space-y-8"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="البريد الإلكتروني"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="password"
                      required
                      type="password"
                      autoComplete="current-password"
                      placeholder="كلمة المرور"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
                {nurseAuthMessage ? (
                  <p className="text-red-600 text-sm text-center leading-relaxed">
                    {nurseAuthMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={authStatus !== "ready"}
                  className="w-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold py-3 rounded-full text-base shadow-lg shadow-brand-600/25 transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none"
                >
                  دخول
                </button>

                <div className="text-center">
                  <span className="text-slate-500">ليس لديك حساب؟ </span>
                  <button
                    type="button"
                    onClick={() => navigateTo("nurse_reg")}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    إنشاء حساب مقدم خدمة
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {view === "nurse_reg" && (
          <motion.div
            key="nurse_reg"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
              <TopBar
                title="حساب مقدم خدمة جديد"
                onBack={() => navigateTo("nurse_login")}
              />
              <form
                onSubmit={handleNurseReg}
                className="p-6 md:p-10 space-y-6 flex flex-col items-center"
              >
                <div className="w-full space-y-4">
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="البريد الإلكتروني"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute right-4 top-3.5 text-slate-400 block w-5 text-center font-bold">
                      📞
                    </span>
                    <input
                      name="phone"
                      required
                      type="tel"
                      autoComplete="tel"
                      placeholder="رقم الهاتف (للتواصل فقط)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="password"
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      placeholder="كلمة المرور (6 أحرف على الأقل)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="relative">
                    <Wallet className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      name="wallet"
                      placeholder="المحفظة الالكترونية (اختياري)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="text-center mt-2 mb-2">
                  <span className="text-slate-500 text-sm font-bold block mb-3">
                    الصورة الشخصية
                  </span>
                  <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center relative border border-slate-200 overflow-hidden">
                    <User className="w-8 h-8 text-slate-400" />
                    <div className="absolute bottom-0 right-0 bg-brand-500 w-7 h-7 rounded-full flex items-center justify-center translate-x-1 translate-y-1 border-2 border-white">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-[200px] flex items-center gap-4 bg-slate-50 p-1.5 rounded-full border border-slate-200">
                  <label className="flex-1 text-center py-2 rounded-full cursor-pointer hover:bg-white transition-colors bg-white shadow-sm font-bold text-slate-700 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      className="hidden"
                      defaultChecked
                    />{" "}
                    ذكـر
                  </label>
                  <label className="flex-1 text-center py-2 rounded-full cursor-pointer hover:bg-white text-slate-500 transition-colors font-bold text-sm">
                    <input type="radio" name="gender" value="female" className="hidden" /> أنثى
                  </label>
                </div>

                <div className="w-full space-y-4">
                  <div>
                    <span className="text-slate-500 text-sm block ml-2 mb-2 font-bold right-0 text-right">
                      شهادة التخرج
                    </span>
                    <button
                      type="button"
                      className="w-full bg-slate-50 text-slate-400 border border-slate-200 border-dashed rounded-2xl py-4 flex flex-col items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5 text-brand-400" />
                      <span className="text-sm font-medium">اختر الملف</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-slate-500 text-sm block ml-2 mb-2 font-bold right-0 text-right">
                      مكان التخرج
                    </span>
                    <input
                      name="graduationPlace"
                      required
                      placeholder="اسم المكان"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-700 text-center outline-none focus:border-brand-500"
                    />
                  </div>

                  <button
                    type="button"
                    className="w-full border-2 border-brand-100 bg-brand-50 text-brand-600 rounded-2xl py-3 font-bold flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" /> تحديد موعد المقابلة
                  </button>
                </div>

                {nurseAuthMessage ? (
                  <p className="text-red-600 text-sm text-center leading-relaxed w-full mt-4">
                    {nurseAuthMessage}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={authStatus !== "ready"}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-full text-base shadow-md shadow-brand-500/25 mt-6 transition-colors duration-300 disabled:opacity-60 disabled:pointer-events-none"
                >
                  إرسال طلب الانضمام
                </button>

                <div className="text-center mt-2 w-full">
                  <span className="text-slate-500">لدي حساب بالفعل؟ </span>
                  <button
                    type="button"
                    onClick={() => navigateTo("nurse_login")}
                    className="text-brand-600 font-bold hover:underline"
                  >
                    تسجيل الدخول
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {view === "patient_services" && (
          <motion.div
            key="patient_services"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-5xl bg-transparent min-h-screen pb-32 pt-6 px-4"
          >
            <div className="flex items-center justify-between bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 mb-6 w-full">
              <button
                onClick={() => navigateTo("patient_reg")}
                className="text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg text-slate-800">الخدمات</span>
              <button
                onClick={() => navigateTo("patient_dashboard")}
                className="text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors font-bold text-sm flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4" /> طلباتي
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {servicesList.map((s) => {
                const isSelected = cart.find((item) => item.id === s.id);
                return (
                  <div
                    key={s.id}
                    className={`group flex flex-col items-center text-center p-4 md:p-5 rounded-2xl border transition-all card-hover cursor-pointer relative overflow-hidden ${isSelected ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10" : "border-slate-200 bg-white hover:border-brand-300"}`}
                    onClick={() => toggleService(s)}
                  >
                    {isSelected && <div className="absolute top-3 left-3 text-brand-600"><CheckCircle2 className="w-5 h-5" /></div>}
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${isSelected ? "bg-brand-500 text-white shadow-md shadow-brand-500/25" : "bg-slate-50 text-brand-500 border border-brand-100"}`}
                    >
                      <s.icon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <span className="text-sm md:text-base font-bold text-slate-800 mb-1.5 leading-tight group-hover:text-brand-700 transition-colors">
                      {s.name}
                    </span>
                    <span className="text-sm font-bold text-slate-500 mb-4 bg-slate-100 px-3 py-1 rounded-md">
                      {s.price} جنيه
                    </span>
                    <button
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all mt-auto ${
                        isSelected
                          ? "bg-brand-100 text-brand-700 hover:bg-brand-200"
                          : "bg-white border border-slate-200 text-slate-600 group-hover:bg-brand-600 group-hover:border-brand-600 group-hover:text-white"
                      }`}
                    >
                      {isSelected ? "إلغاء المطلب" : "إضافة للطلب"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 md:mt-8">
              <button
                onClick={() => navigateTo("full_care")}
                className="group relative w-full overflow-hidden flex items-center justify-center gap-3 bg-white border border-brand-200 p-4 md:p-5 rounded-xl text-brand-700 font-bold hover:bg-brand-50 transition-all text-sm md:text-base shadow-sm hover:shadow-md hover:shadow-brand-500/10 hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center border border-brand-200 text-brand-600 relative z-10 group-hover:scale-105 transition-transform shrink-0">
                  <User className="w-5 h-5" /> 
                </div>
                <span className="relative z-10 text-center leading-snug">طلب تعيين ممرض لرعاية كاملة (بناءً على عدد الساعات)</span>
                <ChevronRight className="w-5 h-5 absolute left-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            </div>

            {/* Footer Summary Bar */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-center z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="w-full max-w-5xl mx-auto p-4 md:py-5 px-6 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-sm font-bold mb-1">
                    الإجمالي:
                  </span>
                  <span className="text-lg md:text-2xl font-bold text-slate-800">
                    {grandTotal}{" "}
                    <span className="text-xs md:text-sm text-slate-500">
                      جنيه
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => navigateTo("summary")}
                  disabled={!hasCartItems}
                  className={`px-8 md:px-12 py-3 rounded-full font-semibold text-base transition-all ${
                    hasCartItems
                      ? "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  استمرار
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === "full_care" && (
          <motion.div
            key="full_care"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-20">
              <TopBar
                title="رعاية كاملة"
                onBack={() => navigateTo("patient_services")}
              />
              <div className="p-6 md:p-8 flex flex-col items-center">
                <User className="w-14 h-14 text-brand-500 mb-4 bg-brand-50 rounded-full p-3" />
                <h3 className="font-bold text-slate-800 text-xl mb-2">
                  رعاية كاملة
                </h3>
                <p className="text-slate-500 text-sm mb-6 text-center max-w-xs">
                  حدد عدد الساعات المطلوبة لخدمة الرعاية الكاملة
                </p>

                <div className="flex items-center gap-4 mb-8 bg-slate-50 border border-slate-100 p-2 rounded-full">
                  <button
                    onClick={() =>
                      setFullCareHours(Math.max(0, fullCareHours - 1))
                    }
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-brand-600 font-bold text-xl shadow-sm border border-slate-200 hover:bg-brand-50 transition-colors"
                  >
                    -
                  </button>
                  <div className="min-w-[4.5rem] text-center flex flex-col">
                    <span className="text-2xl md:text-3xl font-extrabold text-slate-800 tabular-nums">
                      {fullCareHours}
                    </span>
                    <span className="text-slate-400 text-xs font-medium mt-0.5">
                      ساعة
                    </span>
                  </div>
                  <button
                    onClick={() => setFullCareHours(fullCareHours + 1)}
                    className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-brand-600 font-bold text-xl shadow-sm border border-slate-200 hover:bg-brand-50 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => navigateTo("patient_services")}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-full font-semibold text-base shadow-md shadow-brand-500/25 transition-colors"
                >
                  متابعة ومراجعة الطلب
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === "summary" && (
          <motion.div
            key="summary"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-20">
              <TopBar
                title="ملخص طلبك"
                onBack={() => navigateTo("patient_services")}
              />
              <div className="p-6 md:p-10">
                <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] overflow-hidden mb-8">
                  <div className="flex justify-between px-6 py-4 bg-slate-100/50 border-b border-slate-200 font-bold text-slate-500 text-sm">
                    <span>الخدمة</span>
                    <span>السعر</span>
                  </div>
                  <div className="divide-y divide-slate-200 px-6 py-2">
                    {cart.map((s) => (
                      <div
                        key={s.id}
                        className="flex justify-between items-center py-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center">
                            <s.icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-slate-700 text-base">
                            {s.name}
                          </span>
                        </div>
                        <span className="text-slate-500 font-medium">
                          {s.price} جنيه
                        </span>
                      </div>
                    ))}
                    {fullCareHours > 0 && (
                      <div className="flex justify-between items-center py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-slate-700 text-base">
                            رعاية كاملة ({fullCareHours} ساعات)
                          </span>
                        </div>
                        <span className="text-slate-500 font-medium">
                          {fullCareTotal} جنيه
                        </span>
                      </div>
                    )}
                    {hasCartItems && (
                      <div className="flex justify-between items-center py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-slate-700 text-base">
                            المواصلات
                          </span>
                        </div>
                        <span className="text-slate-500 font-medium">
                          {systemSettings.transportCost} جنيه
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between px-6 py-6 bg-brand-50 border-t border-brand-100">
                    <span className="font-bold text-slate-800 text-lg">
                      الإجمالي الكلي
                    </span>
                    <span className="font-bold text-brand-600 text-lg">
                      {grandTotal} جنيه
                    </span>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="medicalDisclaimer"
                    checked={medicalDisclaimerAccepted}
                    onChange={(e) =>
                      setMedicalDisclaimerAccepted(e.target.checked)
                    }
                    className="mt-1 w-5 h-5 text-brand-600 rounded border-slate-300 focus:ring-brand-500 shrink-0"
                  />
                  <label
                    htmlFor="medicalDisclaimer"
                    className="text-sm text-slate-600 leading-relaxed cursor-pointer select-none"
                  >
                    <span className="font-bold text-slate-800 block mb-1">
                      إخلاء مسؤولية طبية
                    </span>
                    أوافق وأقر بأن منصة غيث تلعب دور الوسيط فقط بين المريض ومقدم
                    الخدمة ولا تتحمل أي مسؤولية طبية أو قانونية عن الخدمة
                    المقدمة أو أي أخطاء أو مضاعفات ناتجة عنها.
                  </label>
                </div>

                <button
                  onClick={confirmOrder}
                  disabled={!medicalDisclaimerAccepted}
                  className={`w-full font-semibold py-3 rounded-full text-base shadow-md transition-colors ${medicalDisclaimerAccepted ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25" : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"}`}
                >
                  تأكيد الطلب
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === "success" && (
          <motion.div
            key="success"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex-1 flex items-center justify-center p-6 text-center max-w-2xl mx-auto min-h-screen"
          >
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 w-full flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 relative shrink-0">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
                <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-500 relative" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                تم الحجز بنجاح!
              </h2>
              <p className="text-base text-slate-500 mb-8 max-w-sm">
                سيتم التواصل معك لتأكيد الموعد بأقرب وقت ممكن.
              </p>
              <button
                onClick={() => navigateTo("patient_dashboard")}
                className="w-full max-w-sm bg-brand-50 text-brand-600 font-semibold py-3 rounded-full hover:bg-brand-100 transition-colors text-base mb-3"
              >
                متابعة طلباتي
              </button>
              <button
                onClick={() => navigateTo("landing")}
                className="w-full max-w-sm bg-slate-100 text-slate-700 font-semibold py-3 rounded-full hover:bg-slate-200 transition-colors text-base"
              >
                العودة للرئيسية
              </button>
            </div>
          </motion.div>
        )}

        {view === "patient_dashboard" && (
          <motion.div
            key="patient_dashboard"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen bg-slate-50 flex flex-col font-sans"
          >
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
              <div className="max-w-4xl mx-auto px-4 w-full h-16 flex items-center justify-between">
                <h1 className="font-extrabold text-xl md:text-2xl text-slate-800 tracking-tight">
                  <span className="text-brand-600">سجل</span> طلباتي
                </h1>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigateTo("patient_services")}
                    className="text-white bg-brand-600 hover:bg-brand-700 px-5 py-2.5 rounded-xl transition-colors text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 active:scale-95"
                  >
                    <Activity className="w-4 h-4" /> طلب خدمة جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => void logoutToLanding()}
                    className="text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors text-sm font-bold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> خروج
                  </button>
                </div>
              </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
              <div className="space-y-6">
                {patientOrders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <ClipboardList className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">
                      لا توجد طلبات سابقة
                    </h3>
                    <p className="text-slate-500">
                      قم بطلب أول خدمة صحية لك الآن.
                    </p>
                    <button
                      onClick={() => navigateTo("patient_services")}
                      className="mt-6 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-full transition-colors"
                    >
                      طلب خدمة
                    </button>
                  </div>
                ) : (
                  patientOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-slate-800 text-lg">
                              طلب {order.id}
                            </span>
                            {order.status === "pending" && (
                              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                                قيد الانتظار
                              </span>
                            )}
                            {order.status === "accepted" && (
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                تم التأكيد
                              </span>
                            )}
                            {order.status === "cancelled" && (
                              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
                                تم الإلغاء
                              </span>
                            )}
                            {order.status === "completed" && (
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                مكتمل
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> {order.date}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-brand-600 text-sm mb-1">
                            الإجمالي
                          </span>
                          <span className="font-extrabold text-xl text-slate-800">
                            {order.total} جنيه
                          </span>
                          {order.status === "cancelled" &&
                            order.cancellationFeeApplied && (
                              <span className="block text-red-500 text-xs mt-1 font-bold">
                                رسوم إلغاء مطبقة: {order.cancellationFeeApplied}{" "}
                                جنيه
                              </span>
                            )}
                        </div>
                      </div>

                      <div className="mb-6">
                        <span className="text-slate-500 text-sm font-bold mb-3 block">
                          الخدمات المطلوبة:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {order.services.map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm px-4 py-2 rounded-xl"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {(order.status === "pending" ||
                        order.status === "accepted") && (
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                          <button
                            onClick={() => setCancelOrderPrompt(order.id)}
                            className="text-red-500 hover:bg-red-50 font-bold py-2 px-6 rounded-xl transition-colors text-sm border border-transparent hover:border-red-200"
                          >
                            إلغاء الطلب
                          </button>
                        </div>
                      )}
                      {order.status === "completed" && (
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <span className="text-slate-500 text-sm font-medium">
                            التقييم:
                          </span>
                          <div className="flex gap-1 flex-row-reverse">
                            {[5, 4, 3, 2, 1].map((star) => (
                              <button
                                key={star}
                                onClick={() =>
                                  setPatientOrders((prev) =>
                                    prev.map((o) =>
                                      o.id === order.id
                                        ? { ...o, rating: star }
                                        : o,
                                    ),
                                  )
                                }
                                className="hover:scale-110 transition-transform peer"
                              >
                                <Star
                                  className={`w-5 h-5 ${(order.rating || 0) >= star ? "text-yellow-400 fill-current" : "text-slate-200 peer-hover:text-yellow-400 peer-hover:fill-current hover:text-yellow-400 hover:fill-current"}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </main>

            {cancelOrderPrompt && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-100"
                >
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <X className="w-7 h-7 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 text-center mb-3">
                    تأكيد الإلغاء
                  </h3>

                  {patientOrders.find((o) => o.id === cancelOrderPrompt)
                    ?.status === "accepted" ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                      <p className="text-amber-800 font-medium text-sm text-center leading-relaxed">
                        <span className="font-black block mb-2">
                          تنبيه رسوم الإلغاء!
                        </span>
                        بما أن الطلب قد تم تأكيده بالفعل من قبل مقدم الخدمة،
                        سيتم تطبيق{" "}
                        <span className="font-black underline">
                          رسوم إلغاء بقيمة {systemSettings.transportCost} جنيه
                          (قيمة التوصيل)
                        </span>
                        ، وسيتم خصمها منك وإضافتها لتكلفة عمليتك القادمة وفقاً
                        لسياسة المنصة. هل أنت متأكد من رغبتك في الإلغاء؟
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center mb-8">
                      هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ سيتم تطبيق رسوم
                      إلغاء بقيمة {systemSettings.transportCost} جنيه (قيمة
                      التوصيل) وفقاً لسياسة المنصة.
                    </p>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() =>
                        handleCancelPatientOrder(cancelOrderPrompt)
                      }
                      className="flex-1 bg-red-500 text-white hover:bg-red-600 font-bold py-3.5 rounded-xl transition-colors"
                    >
                      تأكيد الإلغاء
                    </button>
                    <button
                      onClick={() => setCancelOrderPrompt(null)}
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold py-3.5 rounded-xl transition-colors"
                    >
                      تراجع
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {view === "nurse_dashboard" && (
          <motion.div
            key="nurse_dashboard"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans"
          >
            {/* Professional Sidebar */}
            <aside className="w-full md:w-72 bg-white border-l border-slate-200 flex flex-col shrink-0 sticky top-0 md:h-screen z-20">
              <div className="h-20 flex items-center px-8 border-b border-slate-100 relative">
                <span className="font-extrabold text-xl text-brand-600 tracking-tight">
                  غيث
                </span>
                <span className="text-xs font-bold bg-brand-50 text-brand-600 px-2 py-1 rounded ml-2 absolute left-8">
                  مقدم خدمة
                </span>
              </div>

              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">أحمد محمد</h2>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />{" "}
                    <span className="font-medium">4.8</span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <div className="text-xs font-bold text-slate-400 mb-2 px-4 mt-2">
                  القائمة الرئيسية
                </div>
                <button
                  onClick={() => setNurseTab("available")}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors ${nurseTab === "available" ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <ClipboardList
                    className={`w-5 h-5 ${nurseTab === "available" ? "text-brand-500" : "text-slate-400"}`}
                  />
                  <span>الطلبات المتاحة</span>
                  {nurseTab === "available" && (
                    <span className="mr-auto w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                  )}
                </button>
                <button
                  onClick={() => setNurseTab("active")}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors ${nurseTab === "active" ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Clock
                    className={`w-5 h-5 ${nurseTab === "active" ? "text-brand-500" : "text-slate-400"}`}
                  />
                  <span>طلباتي الحالية</span>
                </button>
                <button
                  onClick={() => setNurseTab("history")}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors ${nurseTab === "history" ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <History
                    className={`w-5 h-5 ${nurseTab === "history" ? "text-brand-500" : "text-slate-400"}`}
                  />
                  <span>سجل الطلبات</span>
                </button>

                <div className="text-xs font-bold text-slate-400 mb-2 px-4 mt-8">
                  الإعدادات
                </div>
                <button
                  onClick={() => setNurseTab("settings")}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-colors ${nurseTab === "settings" ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Settings
                    className={`w-5 h-5 ${nurseTab === "settings" ? "text-brand-500" : "text-slate-400"}`}
                  />
                  <span>إعدادات الحساب</span>
                </button>
              </nav>

              <div className="p-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => void logoutToLanding()}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
              {/* Dashboard Header */}
              <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-10 hidden md:flex">
                <h1 className="text-xl font-bold text-slate-800">
                  مرحباً بعودتك، أحمد <span className="text-xl">👋</span>
                </h1>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setNurseTab("available")}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 relative transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {orders.filter((o) => o.status === "pending").length >
                      0 && (
                      <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
                    )}
                  </button>
                  <div className="h-6 w-px bg-slate-200"></div>
                  <span className="text-sm font-medium text-slate-500">
                    نطاق العمل: القاهرة
                  </span>
                </div>
              </header>

              <div className="flex-1 p-6 lg:p-10 max-w-6xl w-full mx-auto">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-sm font-medium mb-1 block">
                        رصيد المحفظة
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-extrabold text-slate-800">
                          2,050
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                          ج.م
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-sm font-medium mb-1 block">
                        المستحق التطبيق
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-extrabold text-red-600">
                          1,200
                        </span>
                        <span className="text-sm font-medium text-red-400">
                          ج.م
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <ArrowLeft className="w-5 h-5 text-red-600 transform rotate-45" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-sm font-medium mb-1 block">
                        صافي أرباحك
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-extrabold text-emerald-600">
                          3,250
                        </span>
                        <span className="text-sm font-medium text-emerald-500">
                          ج.م
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">
                        {nurseTab === "available"
                          ? "الطلبات المتاحة في منطقتك"
                          : nurseTab === "active"
                            ? "طلباتك قيد التنفيذ"
                            : "سجل الطلبات السابقة"}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {nurseTab === "available"
                          ? "راجع الطلبات الجديدة وقم بقبول ما يتناسب معك."
                          : nurseTab === "active"
                            ? "تابع حالة الطلبات التي قمت بقبولها."
                            : "استعرض كافة الطلبات التي قمت بإنجازها."}
                      </p>
                    </div>
                    {nurseTab === "available" && (
                      <span className="flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-brand-100">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                        </span>
                        تحديث مباشر
                      </span>
                    )}
                  </div>

                  <div className="p-8 space-y-4 flex-1">
                    {nurseTab === "available" &&
                      orders.map((order, i) => (
                        <div
                          key={order.id + i}
                          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
                        >
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                              <Calendar className="w-4 h-4 text-slate-400 mb-0.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-base text-slate-800">
                                  {order.services.join("، ")}
                                </span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                  رقم الطلب: {order.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-slate-400" />{" "}
                                  {order.date}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-slate-400" />{" "}
                                  مدينة نصر، القاهرة
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 lg:border-r border-slate-100 lg:pr-6">
                            <div className="text-left">
                              <span className="block text-xs font-medium text-slate-400 mb-0.5">
                                قيمة الطلب
                              </span>
                              <span className="font-bold text-lg text-slate-800">
                                {order.total}{" "}
                                <span className="text-xs">ج.م</span>
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setOrders((prev) =>
                                  prev.filter((o) => o.id !== order.id),
                                );
                                setPatientOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id
                                      ? { ...o, status: "accepted" }
                                      : o,
                                  ),
                                );
                              }}
                              className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl shadow-sm shadow-brand-600/20 text-sm hover:bg-brand-700 transition-colors shrink-0"
                            >
                              قبول الطلب
                            </button>
                          </div>
                        </div>
                      ))}

                    {nurseTab === "available" && orders.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                          <ClipboardList className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-700 mb-2">
                          لا توجد طلبات جديدة
                        </h4>
                        <p className="text-slate-500">
                          ستظهر الطلبات المتاحة في منطقتك هنا فور توفرها.
                        </p>
                      </div>
                    )}

                    {nurseTab === "settings" && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden w-full max-w-2xl mx-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                            <User className="w-8 h-8 text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-slate-800">
                              أحمد محمد
                            </h3>
                            <p className="text-sm font-medium text-slate-500">
                              ممرض معتمد • القاهرة
                            </p>
                          </div>
                        </div>
                        <div className="p-6 space-y-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              رقم الهاتف
                            </label>
                            <input
                              type="tel"
                              disabled
                              value="01012345678"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-600 outline-none cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              تغيير كلمة المرور
                            </label>
                            <input
                              type="password"
                              placeholder="كلمة المرور الجديدة"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-brand-500 transition-colors mb-2"
                            />
                            <input
                              type="password"
                              placeholder="تأكيد كلمة المرور"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                          <button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-brand-500/20">
                            حفظ التعديلات
                          </button>
                        </div>
                      </div>
                    )}

                    {nurseTab === "active" &&
                      patientOrders.filter((o) => o.status === "accepted")
                        .length > 0 &&
                      patientOrders
                        .filter((o) => o.status === "accepted")
                        .map((order, i) => (
                          <div
                            key={order.id + i}
                            className="bg-white border border-brand-200 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden mb-4"
                          >
                            <div className="absolute top-0 right-0 w-1 h-full bg-brand-500"></div>
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex flex-col items-center justify-center shrink-0">
                                <Activity className="w-4 h-4 text-brand-500 mb-0.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-bold text-base text-slate-800">
                                    {order.services.join("، ")}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                                    رقم الطلب: {order.id}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" />{" "}
                                    {order.date}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 lg:border-r border-slate-100 lg:pr-6">
                              <button
                                onClick={() => {
                                  setPatientOrders((prev) =>
                                    prev.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: "completed" }
                                        : o,
                                    ),
                                  );
                                }}
                                className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-sm text-sm hover:bg-emerald-700 transition-colors shrink-0"
                              >
                                إنهاء الطلب بنجاح
                              </button>
                            </div>
                          </div>
                        ))}

                    {nurseTab === "history" &&
                      patientOrders.filter((o) => o.status === "completed")
                        .length > 0 &&
                      patientOrders
                        .filter((o) => o.status === "completed")
                        .map((order, i) => (
                          <div
                            key={order.id + i}
                            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4"
                          >
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-0.5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="font-bold text-base text-slate-800">
                                    {order.services.join("، ")}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                                    مكتمل
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-slate-400" />{" "}
                                    {order.date}
                                  </span>
                                  {order.rating && (
                                    <span className="flex items-center gap-1.5 text-yellow-500">
                                      <Star className="w-4 h-4 fill-current" />{" "}
                                      {order.rating}/5
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                    {nurseTab !== "available" &&
                      nurseTab !== "settings" &&
                      patientOrders.filter((o) =>
                        nurseTab === "active"
                          ? o.status === "accepted"
                          : o.status === "completed",
                      ).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                            <History className="w-8 h-8 text-slate-300" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-700 mb-2">
                            السجل فارغ
                          </h4>
                          <p className="text-slate-500">
                            لا يوجد بيانات لعرضها في هذا القسم حالياً.
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </main>
          </motion.div>
        )}

        {view === "admin_login" && (
          <motion.div
            key="admin_login"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen flex items-center justify-center p-4 md:p-8 bg-slate-900"
          >
            <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden">
              <div className="bg-brand-600 p-8 text-center text-white relative overflow-hidden">
                <Shield className="w-12 h-12 mx-auto mb-3 text-brand-200 relative z-10" />
                <h2 className="text-xl font-bold relative z-10">
                  لوحة إدارة غيث
                </h2>
                <p className="text-brand-100 mt-2 relative z-10">
                  سجل الدخول للمتابعة والموافقة على الطلبات
                </p>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigateTo("admin_dashboard");
                }}
                className="p-6 md:p-10 space-y-8"
              >
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      required
                      type="text"
                      placeholder="اسم المستخدم أو الإيميل"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      required
                      type="password"
                      placeholder="كلمة المرور"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-full text-base shadow-md shadow-slate-900/25 transition-colors duration-300"
                >
                  دخول الإدارة
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigateTo("landing")}
                    className="text-slate-500 hover:text-brand-600 font-bold transition-colors"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {view === "admin_dashboard" && (
          <motion.div
            key="admin_dashboard"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-right"
          >
            {/* Admin Professional Sidebar */}
            <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shrink-0 md:h-screen sticky top-0 z-30">
              <div className="h-20 flex items-center px-8 border-b border-slate-800 relative bg-slate-950/50">
                <Shield className="w-6 h-6 text-brand-500 ml-2 shrink-0" />
                <span className="font-extrabold text-lg md:text-xl tracking-tight">
                  إدارة غيث
                </span>
              </div>

              <div className="p-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                  <User className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white mb-0.5">المدير العام</h2>
                  <span className="text-brand-400 text-xs font-bold bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                    Admin
                  </span>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <div className="text-xs font-bold text-slate-500 mb-3 px-4 mt-4">
                  إدارة المنصة
                </div>
                <button
                  onClick={() => setAdminTab("requests")}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all ${adminTab === "requests" ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <ClipboardList
                    className={`w-5 h-5 ${adminTab === "requests" ? "text-brand-200" : "text-slate-500"}`}
                  />
                  <span>طلبات الانضمام</span>
                  {adminRequests.filter((r) => r.status === "pending").length >
                    0 &&
                    adminTab !== "requests" && (
                      <span className="mr-auto w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                    )}
                  {adminTab === "requests" && (
                    <span className="mr-auto bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                      {
                        adminRequests.filter((r) => r.status === "pending")
                          .length
                      }
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setAdminTab("nurses")}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all ${adminTab === "nurses" ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <Stethoscope
                    className={`w-5 h-5 ${adminTab === "nurses" ? "text-brand-200" : "text-slate-500"}`}
                  />
                  <span>إدارة الممرضين</span>
                </button>
                <button
                  onClick={() => setAdminTab("patients")}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all ${adminTab === "patients" ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <User
                    className={`w-5 h-5 ${adminTab === "patients" ? "text-brand-200" : "text-slate-500"}`}
                  />
                  <span>المرضى</span>
                </button>
                <button
                  onClick={() => setAdminTab("settings")}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all ${adminTab === "settings" ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                >
                  <Settings
                    className={`w-5 h-5 ${adminTab === "settings" ? "text-brand-200" : "text-slate-500"}`}
                  />
                  <span>الإعدادات والأسعار</span>
                </button>
              </nav>

              <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => void logoutToLanding()}
                  className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </aside>

            {/* Admin Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-y-auto">
              <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
                <h1 className="text-xl font-bold text-slate-800">
                  {adminTab === "requests" && "مراجعة طلبات الانضمام"}
                  {adminTab === "nurses" && "إدارة الممرضين ومقدمي الخدمة"}
                  {adminTab === "patients" && "سجل المرضى وحساباتهم"}
                  {adminTab === "settings" && "إعدادات المنصة والأسعار"}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> 28 أبريل
                    2026
                  </div>
                </div>
              </header>

              <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-sm font-medium mb-1 block">
                        طلبات جديدة
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-extrabold text-slate-800">
                          {
                            adminRequests.filter((r) => r.status === "pending")
                              .length
                          }
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100 shrink-0">
                      <FileCheck className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-sm font-medium mb-1 block">
                        إجمالي الممرضين
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-extrabold text-emerald-600">
                          124
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                      <Stethoscope className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <span className="text-slate-500 text-sm font-medium mb-1 block">
                        حجوزات هذا الشهر
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl md:text-2xl font-extrabold text-brand-600">
                          458
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center border border-brand-100 shrink-0">
                      <Activity className="w-5 h-5 text-brand-600" />
                    </div>
                  </div>
                </div>

                {/* Tab Views */}
                {adminTab === "requests" && (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-lg font-bold text-slate-800">
                        قائمة الطلبات قيد المراجعة
                      </h2>
                    </div>

                    <div className="p-2">
                      {adminRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 md:px-6 md:py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-slate-800 mb-0.5">
                                {req.name}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" /> القاهرة
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />{" "}
                                  {req.date}
                                </span>
                                <span className="flex items-center gap-1 font-mono">
                                  {req.phone}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto">
                            {req.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => {
                                    setAdminRequests(
                                      adminRequests.map((r) =>
                                        r.id === req.id
                                          ? { ...r, status: "approved" }
                                          : r,
                                      ),
                                    );
                                  }}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm text-sm"
                                >
                                  <Check className="w-4 h-4" /> قبول
                                </button>
                                <button
                                  onClick={() => {
                                    setAdminRequests(
                                      adminRequests.map((r) =>
                                        r.id === req.id
                                          ? { ...r, status: "rejected" }
                                          : r,
                                      ),
                                    );
                                  }}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold py-2.5 px-6 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm"
                                >
                                  <X className="w-4 h-4" /> رفض
                                </button>
                              </>
                            ) : (
                              <span
                                className={`font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto text-sm ${req.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}
                              >
                                {req.status === "approved" ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> تم
                                    القبول
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4" /> تم الرفض
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {adminRequests.length === 0 && (
                        <div className="text-center py-24 text-slate-400">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <CheckCircle2 className="w-8 h-8 text-slate-300" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-700 mb-1">
                            الكل مراجع
                          </h4>
                          <p className="text-sm">لا يوجد طلبات انضمام جديدة</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {adminTab === "nurses" && (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-lg font-bold text-slate-800">
                        قائمة الممرضين المعتمدين
                      </h2>
                      <button className="text-sm font-bold bg-brand-50 text-brand-600 px-4 py-2 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors">
                        إضافة ممرض
                      </button>
                    </div>
                    <div className="p-2">
                      {/* Mock Data */}
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="p-4 md:px-6 md:py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                                <User className="w-5 h-5 text-slate-400" />
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-slate-800 mb-0.5">
                                {
                                  ["أحمد محمد", "محمود سيد", "سعاد مصطفى"][
                                    item - 1
                                  ]
                                }
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />{" "}
                                  {["4.8", "4.5", "4.9"][item - 1]}
                                </span>
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100">
                                  {["15", "8", "24"][item - 1]} طلب منجز
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedAdminNurse({
                                name: ["أحمد محمد", "محمود سيد", "سعاد مصطفى"][
                                  item - 1
                                ],
                                rating: ["4.8", "4.5", "4.9"][item - 1],
                                ordersCompleted: ["15", "8", "24"][item - 1],
                                phone: "01012345678",
                              })
                            }
                            className="text-slate-500 bg-white hover:text-brand-600 hover:border-brand-200 font-bold py-2 px-5 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm"
                          >
                            عرض الملف
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === "patients" && (
                  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h2 className="text-lg font-bold text-slate-800">
                        قائمة المرضى المسجلين
                      </h2>
                    </div>
                    <div className="p-2">
                      {/* Mock Data */}
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className="p-4 md:px-6 md:py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center border border-brand-100 shrink-0">
                              <User className="w-5 h-5 text-brand-500" />
                            </div>
                            <div>
                              <h4 className="font-bold text-base text-slate-800 mb-0.5">
                                {["خالد إبراهيم", "فاطمة علي"][item - 1]}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1 font-mono">
                                  {["01233334444", "01044445555"][item - 1]}
                                </span>
                                <span className="text-slate-400">
                                  آخر طلب: منذ {["يومين", "أسبوع"][item - 1]}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedAdminPatient({
                                name: ["خالد إبراهيم", "فاطمة علي"][item - 1],
                                phone: ["01233334444", "01044445555"][item - 1],
                                ordersCount: [12, 3][item - 1],
                                cancelledCount: [1, 0][item - 1],
                              })
                            }
                            className="text-slate-500 bg-white hover:text-brand-600 hover:border-brand-200 font-bold py-2 px-5 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm"
                          >
                            التفاصيل
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === "settings" && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                      <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 mb-1">
                            إعدادات الرسوم
                          </h2>
                          <p className="text-slate-500 text-sm">
                            تعديل أسعار الرسوم الثابتة في المنصة.
                          </p>
                        </div>
                      </div>
                      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            رسوم المواصلات والزيارة
                          </label>
                          <div className="relative">
                            <span className="absolute right-4 top-3 text-slate-400 font-bold text-sm">
                              جنيه
                            </span>
                            <input
                              type="number"
                              value={systemSettings.transportCost}
                              onChange={(e) =>
                                setSystemSettings((prev) => ({
                                  ...prev,
                                  transportCost: Number(e.target.value),
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-14 pl-4 text-slate-800 font-bold outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">
                            رسوم الإلغاء المتأخر
                          </label>
                          <div className="relative">
                            <span className="absolute right-4 top-3 text-slate-400 font-bold text-sm">
                              جنيه
                            </span>
                            <input
                              type="number"
                              value={systemSettings.cancellationFee}
                              onChange={(e) =>
                                setSystemSettings((prev) => ({
                                  ...prev,
                                  cancellationFee: Number(e.target.value),
                                }))
                              }
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-14 pl-4 text-slate-800 font-bold outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                      <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 mb-1">
                            تسعير الخدمات
                          </h2>
                          <p className="text-slate-500 text-sm">
                            تعديل التكلفة الأساسية لكل خدمة طبية.
                          </p>
                        </div>
                      </div>
                      <div className="p-2">
                        {servicesList.map((service) => (
                          <div
                            key={service.id}
                            className="p-4 md:px-6 md:py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center border border-brand-100 shrink-0">
                                <service.icon className="w-5 h-5" />
                              </div>
                              <h4 className="font-bold text-slate-800">
                                {service.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-slate-500 font-medium text-sm">
                                السعر (جنيه):
                              </span>
                              <input
                                type="number"
                                value={service.price}
                                onChange={(e) => {
                                  const newPrice = Number(e.target.value);
                                  setServicesList((prev) =>
                                    prev.map((s) =>
                                      s.id === service.id
                                        ? { ...s, price: newPrice }
                                        : s,
                                    ),
                                  );
                                  // Also update existing cart if we want
                                  setCart((prev) =>
                                    prev.map((s) =>
                                      s.id === service.id
                                        ? { ...s, price: newPrice }
                                        : s,
                                    ),
                                  );
                                }}
                                className="w-24 bg-white border border-slate-200 rounded-lg py-2 px-3 text-center text-slate-800 font-bold outline-none focus:border-brand-500"
                              />
                              <button
                                onClick={() =>
                                  setServicesList((prev) =>
                                    prev.filter((s) => s.id !== service.id),
                                  )
                                }
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="حذف الخدمة"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-4 text-sm">
                          إضافة خدمة جديدة
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 mb-2">
                              اسم الخدمة
                            </label>
                            <input
                              type="text"
                              value={newServiceName}
                              onChange={(e) =>
                                setNewServiceName(e.target.value)
                              }
                              placeholder="مثال: قياس الضغط"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-brand-500"
                            />
                          </div>
                          <div className="w-full sm:w-32 shrink-0">
                            <label className="block text-xs font-bold text-slate-500 mb-2">
                              السعر (جنيه)
                            </label>
                            <input
                              type="number"
                              value={newServicePrice}
                              onChange={(e) =>
                                setNewServicePrice(e.target.value)
                              }
                              placeholder="0"
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-center outline-none focus:border-brand-500"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (newServiceName && newServicePrice) {
                                setServicesList((prev) => [
                                  ...prev,
                                  {
                                    id: "new-" + Date.now(),
                                    name: newServiceName,
                                    price: Number(newServicePrice),
                                    icon: Activity,
                                  },
                                ]);
                                setNewServiceName("");
                                setNewServicePrice("");
                              }
                            }}
                            className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                          >
                            إضافة
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Modal Overlay */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col items-center p-6 text-center shadow-2xl"
            >
              <FileText className="w-10 h-10 text-brand-500 mb-3 bg-brand-50 p-2 rounded-full shrink-0" />
              <h3 className="text-lg font-bold text-slate-800 mb-3">
                تعليمات هامة
              </h3>

              <ul className="text-right text-sm text-slate-600 space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 list-disc list-inside">
                <li className="leading-relaxed">
                  عشان أوردر سيتم إضافة رسوم على أي أوردر جديد تطلبه.
                </li>
                <li className="leading-relaxed">
                  الممرض ليس دكتور نحن نقوم بعملنا فقط إذا تم إبلاغك من قبل
                  الممرض أنك لابد أن تذهب الي دكتور فيجب على حضرتك التوجه لدكتور
                  على الفور وبهذا نخلي مسؤوليتنا ومسؤولية الممرض.
                </li>
              </ul>

              <label className="flex items-start gap-3 w-full mb-8 cursor-pointer select-none text-right">
                <div className="mt-0.5">
                  {instructionsAccepted ? (
                    <CheckSquare
                      className="w-5 h-5 text-brand-500"
                      onClick={() => setInstructionsAccepted(false)}
                    />
                  ) : (
                    <Square
                      className="w-5 h-5 text-slate-300"
                      onClick={() => setInstructionsAccepted(true)}
                    />
                  )}
                </div>
                <span
                  className="text-sm font-medium text-slate-700"
                  onClick={() => setInstructionsAccepted(!instructionsAccepted)}
                >
                  أوافق على جميع التعليمات والشروط المذكورة أعلاه
                </span>
              </label>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="flex-1 py-3.5 rounded-full font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleInstructionsAgree}
                  disabled={!instructionsAccepted}
                  className={`flex-1 py-3.5 rounded-full font-bold text-white transition-colors shadow-md ${instructionsAccepted ? "bg-brand-500 shadow-brand-500/30" : "bg-slate-300 shadow-none"}`}
                >
                  موافق
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Modals */}
      <AnimatePresence>
        {selectedAdminNurse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4"
            onClick={() => setSelectedAdminNurse(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  تفاصيل الممرض
                </h3>
                <button
                  onClick={() => setSelectedAdminNurse(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shrink-0">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-800">
                    {selectedAdminNurse.name}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />{" "}
                      {selectedAdminNurse.rating}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100">
                      {selectedAdminNurse.ordersCompleted} طلب منجز
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">
                    رقم الهاتف
                  </span>
                  <p className="font-mono text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedAdminNurse.phone}
                  </p>
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">
                    تاريخ الانضمام
                  </span>
                  <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedAdminNurse.joinDate || "٢٠٢٤/٠١/١٥"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-auto">
                <button className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold py-3.5 rounded-xl transition-colors border border-red-100">
                  إيقاف الحساب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedAdminPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4"
            onClick={() => setSelectedAdminPatient(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden flex flex-col p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  تفاصيل المريض
                </h3>
                <button
                  onClick={() => setSelectedAdminPatient(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center border border-brand-100 shrink-0">
                  <User className="w-8 h-8 text-brand-500" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-800">
                    {selectedAdminPatient.name}
                  </h4>
                  <span className="text-sm text-slate-500 font-medium block mt-1">
                    مستخدم نشط
                  </span>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">
                    رقم الهاتف
                  </span>
                  <p className="font-mono text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedAdminPatient.phone}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">
                      إجمالي الطلبات
                    </span>
                    <p className="font-medium text-brand-600 bg-brand-50 p-3 rounded-xl border border-brand-100 text-center text-lg">
                      {selectedAdminPatient.ordersCount || 5}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 mb-1">
                      الطلبات الملغاة
                    </span>
                    <p className="font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center text-lg">
                      {selectedAdminPatient.cancelledCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
