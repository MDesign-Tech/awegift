import RegisterForm from "@/components/auth/RegisterForm";
import Logo from "@/components/Logo";
import Link from "next/link";
import { Metadata } from "next";
import { FaHome } from "react-icons/fa";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Register | AweGift",
  description: "Create your AweGift account",
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen md:overflow-hidden">
      {/* Left Side - Full image */}
      <div className="hidden md:block md:w-3/5 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=1600&q=80"
          alt="Join Us"
          className="w-full h-full object-cover min-h-screen"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-2/5 flex flex-col justify-center px-4 py-0 sm:px-6 lg:px-0 relative">
        <Link
          href="/"
          className="absolute top-4 right-4 text-sm text-orange-500 hover:text-orange-600 flex items-center gap-2"
        >
          <FaHome size={16} />
          Back to Home
        </Link>
        <div className="mx-auto w-full max-w-sm space-y-0">
          {/* Logo & Header */}
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 flex items-center justify-center">
                <Logo />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Create Account
              </h1>
              <p className="text-gray-600">
                Already have an account?{" "}
                <a
                  href="/auth/signin"
                  className="text-orange-500 font-semibold hover:text-orange-600"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white py-4">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}