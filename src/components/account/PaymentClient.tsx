export default function PaymentClient() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">
          Payments are securely handled by PawaPay during checkout.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No saved payment methods
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-600">
            Choose PawaPay at checkout to select an available mobile money provider.
            AweGift does not store your mobile money PIN or wallet credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
