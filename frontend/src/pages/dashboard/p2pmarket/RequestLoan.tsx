import React, { useState } from 'react';
import { FaMoneyBillWave, FaClock, FaShieldAlt, FaWallet } from 'react-icons/fa';

const RequestLoan = () => {
  const [formData, setFormData] = useState({
    principleAsset: 'ETH',
    principleAmount: '',
    receivingWallet: '',
    repaymentDeadline: '',
    interestRate: '',
    repaymentAsset: 'ETH',
    collateralAsset: 'USDC',
    collateralAmount: '',
    requestExpiry: '72'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportedAssets = ['ETH', 'BTC', 'USDC', 'USDT', 'DAI'];
  const collateralAssets = ['USDC', 'USDT', 'DAI', 'ETH', 'BTC'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Loan request created successfully!');
    }, 2000);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50 rounded-2xl dark:bg-background_dark p-6">
      <div className="w-full h-full overflow-y-scroll">
        {/* Header */}
        <div className="w-full h-auto flex items-center mb-8 gap-3">
          <span className="size-[30px] cursor-pointer overflow-hidden text-primary">
            <FaMoneyBillWave size="100%" />
          </span>
          <h2 className="font-semibold text-2xl dark:text-gray-200 text-gray-800">
            Request Loan
          </h2>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Loan Details Section */}
          <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FaMoneyBillWave className="text-primary" />
              Loan Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Principle Asset
                </label>
                <select
                  name="principleAsset"
                  value={formData.principleAsset}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {supportedAssets.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Principle Amount
                </label>
                <input
                  type="number"
                  name="principleAmount"
                  value={formData.principleAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Receiving Wallet Address
                </label>
                <input
                  type="text"
                  name="receivingWallet"
                  value={formData.receivingWallet}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  placeholder="5.0"
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repayment Asset
                </label>
                <select
                  name="repaymentAsset"
                  value={formData.repaymentAsset}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {supportedAssets.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Collateral Section */}
          <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FaShieldAlt className="text-primary" />
              Collateral (Min 110% of loan value)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collateral Asset
                </label>
                <select
                  name="collateralAsset"
                  value={formData.collateralAsset}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {collateralAssets.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collateral Amount
                </label>
                <input
                  type="number"
                  name="collateralAmount"
                  value={formData.collateralAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Collateral Ratio Display */}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Collateral Ratio: <span className="font-medium text-primary">125%</span> (Recommended)
              </p>
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-white dark:bg-background_dark-tint rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <FaClock className="text-primary" />
              Timeline
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repayment Deadline
                </label>
                <input
                  type="datetime-local"
                  name="repaymentDeadline"
                  value={formData.repaymentDeadline}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Expiry (hours)
                </label>
                <select
                  name="requestExpiry"
                  value={formData.requestExpiry}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">1 week</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating Request...
                </>
              ) : (
                <>
                  <FaWallet />
                  Create Loan Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestLoan;