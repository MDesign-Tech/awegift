"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { LoginSession } from "../../../type";

export default function SettingsClient() {
  const { data: session } = useSession();
  const currentSessionId = (session?.user as any)?.sessionId;
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showLoginActivity, setShowLoginActivity] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [loading2FA, setLoading2FA] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setTwoFactorEnabled(userData.twoFactorEnabled || false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleEnable2FA = async () => {
    setLoading2FA(true);
    try {
      const response = await fetch("/api/auth/enable-2fa", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setTwoFactorSecret(data.secret);
        setShow2FASetup(true);
        toast.success("2FA setup initiated. Please scan the QR code.");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to enable 2FA");
      }
    } catch (error) {
      toast.error("Failed to enable 2FA");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setVerifying2FA(true);
    try {
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (response.ok) {
        setTwoFactorEnabled(true);
        setShow2FASetup(false);
        setQrCodeUrl("");
        setTwoFactorSecret("");
        setVerificationCode("");
        toast.success("2FA enabled successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Failed to verify 2FA code");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    const token = prompt("Enter your 2FA token to disable:");
    if (!token) return;

    setLoading2FA(true);
    try {
      const response = await fetch("/api/auth/disable-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setTwoFactorEnabled(false);
        toast.success("2FA disabled successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to disable 2FA");
      }
    } catch (error) {
      toast.error("Failed to disable 2FA");
    } finally {
      setLoading2FA(false);
    }
  };

  const handleViewLoginActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await fetch("/api/auth/login-activity");
      if (response.ok) {
        const data = await response.json();
        setLoginSessions(data.sessions);
        setShowLoginActivity(true);
      } else {
        toast.error("Failed to fetch login activity");
      }
    } catch (error) {
      toast.error("Failed to fetch login activity");
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to log out this session?")) return;

    setRevokingSession(sessionId);
    try {
      const response = await fetch("/api/auth/revoke-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        toast.success("Session logged out successfully");
        // Refresh the sessions list
        const dataResponse = await fetch("/api/auth/login-activity");
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setLoginSessions(data.sessions);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to revoke session");
      }
    } catch (error) {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSession(null);
    }
  };

  const handleExportData = async () => {
    setLoadingExport(true);
    try {
      const response = await fetch("/api/auth/export-data");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `awegift-data-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF export completed");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }

    setLoadingDelete(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Account deleted successfully");
        // Sign out after deletion
        await signOut({ callbackUrl: "/" });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete account");
      }
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setLoadingDelete(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation("");
    }
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">
          Manage your account security and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Privacy Settings */}
        <div className="bg-light-bg rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-theme-color/10 rounded-lg">
              <svg className="w-6 h-6 text-theme-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Privacy & Security
              </h3>
              <p className="text-sm text-gray-600">
                Manage your account security settings
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* 2FA Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-100' : 'bg-gray-200'}`}>
                  <svg className={`w-5 h-5 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    Two-Factor Authentication
                  </div>
                  <div className="text-sm text-gray-600">
                    {twoFactorEnabled ? "Extra security layer is enabled" : "Add an extra layer of security to your account"}
                  </div>
                </div>
              </div>
              <button
                onClick={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                disabled={loading2FA || loadingActivity || loadingExport || loadingDelete}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors ${
                  twoFactorEnabled
                    ? "text-red-700 bg-red-100 hover:bg-red-200 border-red-300"
                    : "text-white bg-theme-color hover:bg-theme-color/90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading2FA ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : twoFactorEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            {/* Login Activity Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Login Activity</div>
                  <div className="text-sm text-gray-600">
                    View recent login attempts and active sessions
                  </div>
                </div>
              </div>
              <button
                onClick={handleViewLoginActivity}
                disabled={loading2FA || loadingActivity || loadingExport || loadingDelete}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingActivity ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : "View Activity"}
              </button>
            </div>

            {/* Data Export Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Data Export</div>
                  <div className="text-sm text-gray-600">
                    Download a copy of your account data
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportData}
                disabled={loading2FA || loadingActivity || loadingExport || loadingDelete}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingExport ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : "Export Data"}
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-light-bg rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Account Actions
              </h3>
              <p className="text-sm text-gray-600">
                Manage your account and sign out
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sign Out */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Sign Out</div>
                  <div className="text-sm text-gray-600">
                    Sign out of your account on this device
                  </div>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Delete Account */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-red-900">Delete Account</div>
                    <div className="text-sm text-red-700">
                      Permanently delete your account and all associated data
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading2FA || loadingActivity || loadingExport || loadingDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingDelete ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Activity Modal */}
      {showLoginActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowLoginActivity(false)}
          ></div>

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-white shadow-xl rounded-lg overflow-hidden z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 gap-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    Recent Login Activity
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    Your recent login sessions and activity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginActivity(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              {loginSessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Login Activity
                  </h3>
                  <p className="text-gray-600">
                    Your login activity will appear here once you start using your account.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loginSessions.map((session) => {
                    const isCurrentSession = session.id === currentSessionId;
                    const isRevoked = (session as any).revoked;
                    return (
                      <div
                        key={session.id}
                        className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border ${
                          isRevoked
                            ? 'bg-red-50 border-red-200'
                            : isCurrentSession
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            isRevoked
                              ? 'bg-red-100'
                              : isCurrentSession
                              ? 'bg-green-100'
                              : 'bg-theme-color/10'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              isRevoked
                                ? 'text-red-600'
                                : isCurrentSession
                                ? 'text-green-600'
                                : 'text-theme-color'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className={`font-medium ${
                              isRevoked ? 'text-red-900' : 'text-gray-900'
                            }`}>
                              {session.device} - {session.browser}
                              {isCurrentSession && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Current</span>}
                              {isRevoked && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Logged Out</span>}
                            </div>
                            <div className="text-sm text-gray-600">
                              IP: {session.ip}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(session.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(session.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {!isCurrentSession && !isRevoked && (
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              disabled={revokingSession === session.id}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {revokingSession === session.id ? (
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                "Log Out"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setShowLoginActivity(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShow2FASetup(false)}
          ></div>

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 gap-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-theme-color/10 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-theme-color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    Setup Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    Scan the QR code with your authenticator app
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShow2FASetup(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              <div className="text-center">
                <div className="mb-6">
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    className="mx-auto w-48 h-48 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Can't scan the code? Enter this secret manually:
                  </p>
                  <code className="block p-2 bg-gray-100 rounded text-xs font-mono break-all">
                    {twoFactorSecret}
                  </code>
                </div>

                <div className="mb-6">
                  <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter the 6-digit code from your app
                  </label>
                  <input
                    type="text"
                    id="verification-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-theme-color focus:border-theme-color text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShow2FASetup(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={verifying2FA || verificationCode.length !== 6}
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-theme-color hover:bg-theme-color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying2FA ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </>
                    ) : "Verify & Enable"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background overlay */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowDeleteConfirm(false)}
          ></div>

          {/* Modal */}
          <div className="relative w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-red-900">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-700">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-6">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to permanently delete your account? This will remove all your data and cannot be undone.
                  </p>
                </div>

                <div>
                  <label htmlFor="delete-confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 uppercase text-center font-bold"
                    placeholder="DELETE"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAccount}
                    disabled={loadingDelete || deleteConfirmation !== "DELETE"}
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingDelete ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : "Delete Account"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
