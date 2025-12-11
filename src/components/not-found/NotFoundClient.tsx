"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function NotFoundClient() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {/* Current Path Display */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xl mx-auto">
        <p className="text-red-700">
          <span className="font-medium">Requested URL:</span>{" "}
          <code className="bg-red-100 px-2 py-1 rounded text-sm font-mono">
            {pathname}
          </code>
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/"
          className="px-8 py-3 bg-theme-color text-white rounded-xl hover:bg-theme-color/90 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          🏠 Back to Home
        </Link>

        <button
          onClick={() => router.back()}
          className="px-8 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium hover:border-gray-400 transform hover:-translate-y-0.5"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}
