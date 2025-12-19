import React, { useContext, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ClipboardDocumentListIcon } from './Icons';

const CustomerDetailsForm: React.FC = () => {
    const { customerDetails, setCustomerDetails } = useContext(AppContext);
    const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'attendees') {
            const numValue = parseInt(value, 10);
            setCustomerDetails(prev => ({ ...prev, [name]: isNaN(numValue) || numValue < 1 ? 1 : numValue }));
        } else {
            setCustomerDetails(prev => ({ ...prev, [name]: value }));
        }
    };

    useEffect(() => {
        const textarea = notesTextareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [customerDetails.notes]);

    const inputClasses = "w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition";
    const labelClasses = "text-sm text-gray-400 sm:text-left";

    return (
        <div className="mb-6 border-b border-gray-700 pb-6">
            <div className="mb-4 flex items-center space-x-3">
                <ClipboardDocumentListIcon className="w-6 h-6 text-amber-400"/>
                <h3 className="text-xl font-semibold text-amber-400">Customer Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_1.5fr] gap-x-4 gap-y-3 items-center">
                {/* Row 1: Name & Email */}
                <label htmlFor="name" className={labelClasses}>Name</label>
                <input id="name" name="name" value={customerDetails.name} onChange={handleChange} className={inputClasses} placeholder="Customer name" />
                <label htmlFor="email" className={labelClasses}>Email</label>
                <input id="email" name="email" value={customerDetails.email} onChange={handleChange} type="email" className={inputClasses} placeholder="Email address" />
                
                {/* Row 2: Business & Address */}
                <label htmlFor="business" className={labelClasses}>Business</label>
                <input id="business" name="business" value={customerDetails.business} onChange={handleChange} className={inputClasses} placeholder="Business name (optional)" />
                <label htmlFor="address" className={labelClasses}>Address</label>
                <input id="address" name="address" value={customerDetails.address} onChange={handleChange} className={inputClasses} placeholder="Delivery address" />

                {/* Row 3: Mobile */}
                <label htmlFor="contactNumber" className={labelClasses}>Mobile</label>
                <input id="contactNumber" name="contactNumber" value={customerDetails.contactNumber} onChange={handleChange} className={inputClasses} placeholder="Contact number" />
            </div>
            
            <div className="mt-4 border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label htmlFor="serviceType" className={labelClasses}>Service</label>
                        <select
                            id="serviceType"
                            name="serviceType"
                            value={customerDetails.serviceType}
                            onChange={handleChange}
                            className={`${inputClasses} w-auto`}
                        >
                            <option>Delivery</option>
                            <option>Pickup</option>
                            <option>Full Service</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="attendees" className={labelClasses}>Attendees</label>
                        <input
                            id="attendees"
                            name="attendees"
                            type="number"
                            value={customerDetails.attendees}
                            onChange={handleChange}
                            className={`${inputClasses} w-14 text-center px-1`}
                            min="1"
                            style={{ width: '3.5rem' }}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label htmlFor="equipmentType" className={labelClasses}>Equipment</label>
                        <select
                            id="equipmentType"
                            name="equipmentType"
                            value={customerDetails.equipmentType}
                            onChange={handleChange}
                            className={`${inputClasses} w-auto`}
                        >
                            <option>Takeaway</option>
                            <option>Warmers</option>
                        </select>
                    </div>
                </div>

                
            </div>
        </div>
    );
}

export default CustomerDetailsForm;
