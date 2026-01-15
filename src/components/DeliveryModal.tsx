import { FiX, FiTruck } from "react-icons/fi";

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  freeShippingThreshold: string;
}

const DeliveryModal = ({
  isOpen,
  onClose,
  freeShippingThreshold,
}: DeliveryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden z-10 min-h-[80vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiTruck className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Free Delivery
              </h3>
              <p className="text-sm text-gray-600">
                Enjoy free Delivery on your orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-6">
          <div className="text-center">
            <FiTruck className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Free Delivery on Orders Over {freeShippingThreshold} RWF
            </h4>
            <p className="text-gray-600 mb-4">
              Shop now and enjoy complimentary delivery when your order total exceeds {freeShippingThreshold} RWF. No hidden fees, just fast and reliable shipping to your doorstep.
            </p>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Delivery Benefits:</strong>
              </p>
              <ul className="text-sm text-orange-700 mt-2 space-y-1">
                <li>• Fast and secure delivery</li>
                <li>• Real-time tracking</li>
                <li>• No additional charges</li>
                <li>• Customer support available</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryModal;