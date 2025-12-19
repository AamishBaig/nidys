import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { MenuItem } from '../types';
import Modal from './Modal';
import emailjs from '@emailjs/browser';
import { 
  SpinnerIcon, 
  ArrowDownTrayIcon, 
  EnvelopeIcon, 
  ClipboardDocumentListIcon 
} from './Icons';
import { EMAIL_CONFIG } from '../emailConfig';
declare const html2canvas: any;

// Helper function to generate HTML email template
const generateEmailHTML = (
    allDaysData: Array<{
        day: string;
        date: string;
        time: string;
        event: string;
        notes: string;
        items: Array<{ name: string; quantity: number; price: number; total: number; categoryTitle: string }>;
        subtotal: number;
    }>,
    customerDetails: any,
    subtotal: number,
    serviceFee: number,
    gst: number,
    total: number,
    appTitle: string
): string => {
    const attendees = customerDetails.attendees > 0 ? customerDetails.attendees : 1;
    const perHeadPrice = total / attendees;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Summary</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #e5e7eb;
            max-width: 700px;
            margin: 0 auto;
            padding: 20px;
            background-color: #111827;
        }
        .container {
            background: #1f2937;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header {
            background: #1f2937;
            color: #fbbf24;
            padding: 32px;
            text-align: center;
            border-bottom: 2px solid #374151;
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 16px;
            color: #9ca3af;
        }
        .content {
            padding: 32px;
        }
        .section {
            margin-bottom: 32px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #fbbf24;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #374151;
        }
        .customer-details {
            background: #374151;
            border-radius: 8px;
            padding: 20px;
        }
        .detail-row {
            display: flex;
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #9ca3af;
            min-width: 140px;
        }
        .detail-value {
            color: #e5e7eb;
        }
        .category-header {
            background: #374151;
            padding: 12px 16px;
            font-weight: 600;
            color: #fbbf24;
            border-radius: 6px;
            margin-top: 16px;
            margin-bottom: 12px;
        }
        .order-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #374151;
        }
        .order-item:last-child {
            border-bottom: none;
        }
        .item-details {
            flex: 1;
        }
        .item-name {
            font-weight: 600;
            color: #e5e7eb;
            margin-bottom: 4px;
        }
        .item-meta {
            font-size: 14px;
            color: #9ca3af;
        }
        .item-price {
            font-weight: 600;
            color: #fbbf24;
            text-align: right;
            min-width: 80px;
        }
        .totals {
            background: #374151;
            border-radius: 8px;
            padding: 20px;
            margin-top: 24px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 15px;
            color: #9ca3af;
        }
        .total-row.subtotal {
            color: #9ca3af;
        }
        .total-row.final-total {
            border-top: 2px solid #4b5563;
            margin-top: 12px;
            padding-top: 16px;
            font-size: 20px;
            font-weight: 700;
            color: #fbbf24;
        }
        .total-row.per-head {
            background: #1f2937;
            margin: 12px -20px -20px -20px;
            padding: 16px 20px;
            border-radius: 0 0 8px 8px;
            font-weight: 600;
            color: #fbbf24;
        }
        .footer {
            background: #1f2937;
            padding: 24px 32px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            border-top: 2px solid #374151;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label {
                margin-bottom: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${appTitle}</h1>
            <p>Order Summary & Quote</p>
        </div>
        
        <div class="content">
            <!-- Customer Details Section -->
            <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="customer-details">
                    ${customerDetails.name ? `<div class="detail-row"><span class="detail-label">Name:</span><span class="detail-value">${customerDetails.name}</span></div>` : ''}
                    ${customerDetails.email ? `<div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">${customerDetails.email}</span></div>` : ''}
                    ${customerDetails.contactNumber ? `<div class="detail-row"><span class="detail-label">Contact:</span><span class="detail-value">${customerDetails.contactNumber}</span></div>` : ''}
                    ${customerDetails.business ? `<div class="detail-row"><span class="detail-label">Business:</span><span class="detail-value">${customerDetails.business}</span></div>` : ''}
                    ${customerDetails.address ? `<div class="detail-row"><span class="detail-label">Address:</span><span class="detail-value">${customerDetails.address}</span></div>` : ''}
                    <div class="detail-row"><span class="detail-label">Attendees:</span><span class="detail-value">${customerDetails.attendees}</span></div>
                    <div class="detail-row"><span class="detail-label">Service Type:</span><span class="detail-value">${customerDetails.serviceType}</span></div>
                    <div class="detail-row"><span class="detail-label">Equipment:</span><span class="detail-value">${customerDetails.equipmentType}</span></div>
                </div>
            </div>

            <!-- Order Items Section -->
            <div class="section">
                <div class="section-title">Order Details (${allDaysData.length} Order${allDaysData.length > 1 ? 's' : ''})</div>
                ${allDaysData.map(dayData => {
                    const formatDayItems = (items: any[]) => {
                        const grouped = items.reduce((acc: any, item: any) => {
                            if (!acc[item.categoryTitle]) acc[item.categoryTitle] = [];
                            acc[item.categoryTitle].push(item);
                            return acc;
                        }, {});

                        return Object.entries(grouped).map(([categoryTitle, categoryItems]: [string, any]) => `
                            <div class="category-header">${categoryTitle}</div>
                            ${categoryItems.map((item: any) => `
                                <div class="order-item">
                                    <div class="item-details">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-meta">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
                                    </div>
                                    <div class="item-price">$${item.total.toFixed(2)}</div>
                                </div>
                            `).join('')}
                        `).join('');
                    };

                    return `
                        <div style="background: #374151; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                            <div style="background: #1f2937; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
                                <div style="font-size: 20px; font-weight: 700; color: #fbbf24; margin-bottom: 8px;">${dayData.day}</div>
                                <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 14px; color: #9ca3af;">
                                    <div><span style="font-weight: 600;">Event:</span> ${dayData.event}</div>
                                    <div><span style="font-weight: 600;">Date:</span> ${dayData.date}</div>
                                    <div><span style="font-weight: 600;">Time:</span> ${dayData.time}</div>
                                </div>
                                ${dayData.notes ? `<div style="margin-top: 8px; font-size: 13px; color: #d1d5db; font-style: italic;"><span style="font-weight: 600; color: #9ca3af;">Notes:</span> ${dayData.notes}</div>` : ''}
                            </div>
                            ${formatDayItems(dayData.items)}
                            <div style="background: #1f2937; padding: 12px 16px; margin-top: 12px; border-radius: 6px; display: flex; justify-content: space-between; font-weight: 600; color: #fbbf24;">
                                <span>Day Subtotal</span>
                                <span>$${dayData.subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <!-- Totals -->
                <div class="totals">
                    <div class="total-row subtotal">
                        <span>Subtotal (All Days)</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-row subtotal">
                        <span>Service Fee (${customerDetails.serviceType})</span>
                        <span>$${serviceFee.toFixed(2)}</span>
                    </div>
                    <div class="total-row subtotal">
                        <span>GST (10%)</span>
                        <span>$${gst.toFixed(2)}</span>
                    </div>
                    <div class="total-row final-total">
                        <span>GRAND TOTAL</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                    ${total > 0 ? `
                        <div class="total-row per-head">
                            <span>Price Per Head (${attendees} ${attendees === 1 ? 'person' : 'people'})</span>
                            <span>$${perHeadPrice.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your order! We'll be in touch shortly.</p>
            <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">Order received: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
};

interface SendOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderSummaryRef: React.RefObject<HTMLDivElement>;
    customerDetailsRef: React.RefObject<HTMLDivElement>;
}

interface DownloadLinkProps {
    href: string | null;
    download: string;
    children?: React.ReactNode;
}

const DownloadLink: React.FC<DownloadLinkProps> = ({ href, download, children }) => (
    <a 
        href={href ?? '#'} 
        download={download}
        className={`flex items-center space-x-3 px-4 py-3 bg-gray-700 rounded-lg text-left w-full transition-colors ${href ? 'hover:bg-indigo-600' : 'opacity-50 cursor-not-allowed'}`}
        onClick={(e) => !href && e.preventDefault()}
    >
       {children}
    </a>
);

const SendOrderModal: React.FC<SendOrderModalProps> = ({ isOpen, onClose, orderSummaryRef, customerDetailsRef }) => {
        const { customerDetails, eventDays, menuData, appTitle, saveCurrentOrder } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    const [assets, setAssets] = useState<{ 
        pdfUrl: string | null; 
        emailHtml: string | null;
    }>({
        pdfUrl: null,
        emailHtml: null,
    });
    
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [emailError, setEmailError] = useState<string | null>(null);
    
    // Calculate order details
    const { allDaysData, grandSubtotal, totalServiceFee, totalGST, grandTotal } = useMemo(() => {
        const allMenuItems = menuData.flatMap(category =>
            category.items.map(item => ({ ...item, categoryTitle: category.title }))
        );

        let totalSub = 0;
        const daysData: any[] = [];

        eventDays.forEach(day => {
            const dayItems = Object.keys(day.order)
                .map(itemId => {
                    const item = allMenuItems.find(i => i.id === itemId);
                    if (item && item.isAvailable) {
                        return {
                            name: item.name,
                            quantity: day.order[itemId],
                            price: item.price,
                            total: item.price * day.order[itemId],
                            categoryTitle: item.categoryTitle
                        };
                    }
                    return null;
                })
                .filter(item => item !== null);

            const daySubtotal = dayItems.reduce((acc: number, item: any) => acc + item.total, 0);
            totalSub += daySubtotal;

            daysData.push({
                day: day.label,
                date: day.dayDate || 'TBD',
                time: day.dropTime || 'TBD',
                event: day.event || 'Event',
                notes: day.notes || '',
                items: dayItems,
                subtotal: daySubtotal
            });
        });

        let serviceFee = 0;
        if (totalSub > 0) {
            switch (customerDetails.serviceType) {
                case 'Delivery': serviceFee = 40; break;
                case 'Full Service': serviceFee = 100; break;
                default: serviceFee = 0;
            }
        }

        const gst = totalSub * 0.10;
        const total = totalSub + gst + serviceFee;

        return { allDaysData: daysData, grandSubtotal: totalSub, totalServiceFee: serviceFee, totalGST: gst, grandTotal: total };
    }, [eventDays, menuData, customerDetails.serviceType]);
    
    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (assets.pdfUrl) URL.revokeObjectURL(assets.pdfUrl);
        };
    }, [assets]);
    
    useEffect(() => {
        if (isOpen) {
            const generateAssets = async () => {
                setIsLoading(true);
                setEmailStatus('idle');
                setEmailError(null);
                setAssets({ pdfUrl: null, emailHtml: null });

                await new Promise(res => setTimeout(res, 100));

                try {
                    // Generate PDF - Multi-page
                    const { jsPDF } = (window as any).jspdf;
                    let pdfUrl = null;

                    const a4Width = 794;
                    const a4Height = 1123;
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [a4Width, a4Height] });

                    // PRINT-FRIENDLY PDF STYLES (Black & White)
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.width = '794px';
                    tempContainer.style.padding = '40px';
                    tempContainer.style.backgroundColor = '#ffffff'; // White background
                    tempContainer.style.color = '#000000'; // Black text
                    tempContainer.style.fontFamily = 'Arial, sans-serif';
                    tempContainer.style.boxSizing = 'border-box';
                    document.body.appendChild(tempContainer);

                    const serviceFee = totalServiceFee;
                    const gst = totalGST;
                    const total = grandTotal;
                    const attendees = customerDetails.attendees > 0 ? customerDetails.attendees : 1;
                    const perHeadPrice = total / attendees;

                    // Header for Print
                    const headerHTML = `
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #000000;">${appTitle}</h1>
                            <p style="margin: 0; font-size: 16px; color: #000000;">Order Summary & Quote</p>
                        </div>
                    `;

                    // Customer details HTML - Print Friendly
                    const customerHTML = `
                        <div style="margin-bottom: 24px; border: 2px solid #000000; padding: 16px; border-radius: 8px;">
                            <h3 style="margin: 0 0 16px 0; color: #000000; font-size: 18px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000000; padding-bottom: 8px;">Customer Details</h3>
                            <div style="display: flex; gap: 24px; line-height: 1.6; font-size: 14px; color: #000000;">
                                <div style="flex: 1;">
                                    ${customerDetails.name ? `<div style="margin-bottom: 8px;"><strong style="color: #000000;">Name:</strong> ${customerDetails.name}</div>` : ''}
                                    ${customerDetails.email ? `<div style="margin-bottom: 8px;"><strong style="color: #000000;">Email:</strong> ${customerDetails.email}</div>` : ''}
                                    ${customerDetails.contactNumber ? `<div style="margin-bottom: 8px;"><strong style="color: #000000;">Contact:</strong> ${customerDetails.contactNumber}</div>` : ''}
                                    ${customerDetails.address ? `<div style="margin-bottom: 8px;"><strong style="color: #000000;">Address:</strong> ${customerDetails.address}</div>` : ''}
                                </div>
                                <div style="flex: 1;">
                                    ${customerDetails.business ? `<div style="margin-bottom: 8px;"><strong style="color: #000000;">Business:</strong> ${customerDetails.business}</div>` : ''}
                                    <div style="margin-bottom: 8px;"><strong style="color: #000000;">Attendees:</strong> ${customerDetails.attendees}</div>
                                    <div style="margin-bottom: 8px;"><strong style="color: #000000;">Service:</strong> ${customerDetails.serviceType}</div>
                                    <div style="margin-bottom: 8px;"><strong style="color: #000000;">Equipment:</strong> ${customerDetails.equipmentType}</div>
                                </div>
                            </div>
                        </div>
                    `;

                    // PAGE 1: Header + Customer Details + First Order + Totals
                    tempContainer.innerHTML = headerHTML + customerHTML;

                    if (allDaysData.length > 0) {
                        const firstDay = allDaysData[0];
                        const dayObj = eventDays.find(d => d.label === firstDay.day);
                        
                        const groupedItems = firstDay.items.reduce((acc: any, item: any) => {
                            if (!acc[item.categoryTitle]) acc[item.categoryTitle] = [];
                            acc[item.categoryTitle].push(item);
                            return acc;
                        }, {});

                        let orderHTML = `
                            <div style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 8px 0; color: #000000; font-size: 18px; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 4px;">${firstDay.day}</h3>
                                ${dayObj ? `
                                    <div style="margin-bottom: 20px; font-size: 14px; color: #000000; line-height: 1.6; border: 1px solid #000000; padding: 12px; border-radius: 6px; background-color: #ffffff;">
                                        <div style="display: flex; gap: 24px; margin-bottom: 8px;">
                                            ${dayObj.event ? `<div><strong style="color: #000000;">Event:</strong> ${dayObj.event}</div>` : ''}
                                            ${dayObj.dayDate ? `<div><strong style="color: #000000;">Date:</strong> ${dayObj.dayDate}</div>` : ''}
                                            ${dayObj.dropTime ? `<div><strong style="color: #000000;">Time:</strong> ${dayObj.dropTime}</div>` : ''}
                                        </div>
                                        ${dayObj.notes ? `<div style="margin-top: 8px; border-top: 1px dashed #000000; padding-top: 8px;"><strong style="color: #000000;">Notes:</strong> ${dayObj.notes}</div>` : ''}
                                    </div>
                                ` : ''}
                        `;

                        Object.entries(groupedItems).forEach(([categoryTitle, items]: [string, any]) => {
                            orderHTML += `
                                <div style="margin-bottom: 16px;">
                                    <div style="border-bottom: 2px solid #000000; padding: 4px 0; font-weight: bold; color: #000000; margin-bottom: 12px; font-size: 16px; text-transform: uppercase;">${categoryTitle}</div>
                                    ${items.map((item: any) => `
                                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #000000;">
                                            <span>${item.name} × ${item.quantity}</span>
                                            <span style="color: #000000; font-weight: bold;">$${item.total.toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        });

                        orderHTML += `
                            <div style="text-align: right; padding-right: 12px; font-weight: bold; color: #000000; font-size: 14px; margin-top: 8px;">
                                Subtotal: $${firstDay.subtotal.toFixed(2)}
                            </div>
                        </div>`;

                        tempContainer.innerHTML += orderHTML;
                    }

                    // Add grand totals - Print Friendly
                    tempContainer.innerHTML += `
                        <div style="border-top: 2px solid #000000; padding-top: 16px; margin-top: 24px; color: #000000;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                                <span style="color: #000000;">Grand Subtotal:</span>
                                <span>$${grandSubtotal.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                                <span style="color: #000000;">Service Fee (${customerDetails.serviceType}):</span>
                                <span>$${serviceFee.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; padding-bottom: 12px; border-bottom: 1px solid #cccccc;">
                                <span style="color: #000000;">GST (10%):</span>
                                <span>$${gst.toFixed(2)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 18px; font-weight: bold; color: #000000;">
                                <span>TOTAL:</span>
                                <span>$${total.toFixed(2)}</span>
                            </div>
                            ${total > 0 ? `
                                <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #000000; border: 1px solid #000000; padding: 12px; border-radius: 4px; margin-top: 16px;">
                                    <span>Price Per Head (${attendees} ${attendees === 1 ? 'person' : 'people'}):</span>
                                    <span>$${perHeadPrice.toFixed(2)}</span>
                                </div>
                            ` : ''}
                        </div>
                    `;

                    await new Promise(res => setTimeout(res, 50));
                    // Capture with white background
                    const canvas1 = await html2canvas(tempContainer, { scale: 2, backgroundColor: '#ffffff', logging: false });
                    const scaleX = a4Width / canvas1.width;
                    const scaleY = a4Height / canvas1.height;
                    const scale = Math.min(scaleX, scaleY, 1);
                    const scaledWidth = canvas1.width * scale;
                    const scaledHeight = canvas1.height * scale;
                    const xOffset = (a4Width - scaledWidth) / 2;
                    pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', xOffset, 0, scaledWidth, scaledHeight);

                    // PAGES 2+: Each subsequent order on its own page
                    for (let i = 1; i < allDaysData.length; i++) {
                        const dayData = allDaysData[i];
                        const dayObj = eventDays.find(d => d.label === dayData.day);
                        
                        const groupedItems = dayData.items.reduce((acc: any, item: any) => {
                            if (!acc[item.categoryTitle]) acc[item.categoryTitle] = [];
                            acc[item.categoryTitle].push(item);
                            return acc;
                        }, {});

                        let pageHTML = `
                            ${headerHTML}
                            <div style="margin-bottom: 24px;">
                                <h3 style="margin: 0 0 8px 0; color: #000000; font-size: 18px; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 4px;">${dayData.day}</h3>
                                ${dayObj ? `
                                    <div style="margin-bottom: 20px; font-size: 14px; color: #000000; line-height: 1.6; border: 1px solid #000000; padding: 12px; border-radius: 6px; background-color: #ffffff;">
                                        <div style="display: flex; gap: 24px; margin-bottom: 8px;">
                                            ${dayObj.event ? `<div><strong style="color: #000000;">Event:</strong> ${dayObj.event}</div>` : ''}
                                            ${dayObj.dayDate ? `<div><strong style="color: #000000;">Date:</strong> ${dayObj.dayDate}</div>` : ''}
                                            ${dayObj.dropTime ? `<div><strong style="color: #000000;">Time:</strong> ${dayObj.dropTime}</div>` : ''}
                                        </div>
                                        ${dayObj.notes ? `<div style="margin-top: 8px; border-top: 1px dashed #000000; padding-top: 8px;"><strong style="color: #000000;">Notes:</strong> ${dayObj.notes}</div>` : ''}
                                    </div>
                                ` : ''}
                        `;

                        Object.entries(groupedItems).forEach(([categoryTitle, items]: [string, any]) => {
                            pageHTML += `
                                <div style="margin-bottom: 16px;">
                                    <div style="border-bottom: 2px solid #000000; padding: 4px 0; font-weight: bold; color: #000000; margin-bottom: 12px; font-size: 16px; text-transform: uppercase;">${categoryTitle}</div>
                                    ${items.map((item: any) => `
                                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; color: #000000;">
                                            <span>${item.name} × ${item.quantity}</span>
                                            <span style="color: #000000; font-weight: bold;">$${item.total.toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        });

                        pageHTML += `
                            <div style="text-align: right; padding-right: 12px; font-weight: bold; color: #000000; font-size: 14px; margin-top: 8px;">
                                Subtotal: $${dayData.subtotal.toFixed(2)}
                            </div>
                        </div>`;

                        tempContainer.innerHTML = pageHTML;
                        await new Promise(res => setTimeout(res, 50));
                        
                        pdf.addPage();
                        const canvas = await html2canvas(tempContainer, { scale: 2, backgroundColor: '#ffffff', logging: false });
                        const scaleX = a4Width / canvas.width;
                        const scaleY = a4Height / canvas.height;
                        const scale = Math.min(scaleX, scaleY, 1);
                        const scaledWidth = canvas.width * scale;
                        const scaledHeight = canvas.height * scale;
                        const xOffset = (a4Width - scaledWidth) / 2;
                        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOffset, 0, scaledWidth, scaledHeight);
                    }

                    document.body.removeChild(tempContainer);
                    const pdfBlob = pdf.output('blob');
                    pdfUrl = URL.createObjectURL(pdfBlob);

                    // Generate HTML Email Template (Kept dark mode for emails as it looks better on screen)
                    const emailHtml = generateEmailHTML(
                        allDaysData,
                        customerDetails,
                        grandSubtotal,
                        totalServiceFee,
                        totalGST,
                        grandTotal,
                        appTitle
                    );

                    setAssets({ pdfUrl, emailHtml });

                } catch (error) {
                    console.error("Failed to generate assets:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            generateAssets();
        }
    }, [isOpen, orderSummaryRef, customerDetailsRef, customerDetails, allDaysData, grandSubtotal, totalServiceFee, totalGST, grandTotal, appTitle, eventDays]);

    // Send email via EmailJS
    const handleSendEmail = async () => {
        if (!assets.emailHtml) {
            setEmailError('Email content not ready');
            return;
        }

        const serviceId = EMAIL_CONFIG.SERVICE_ID;
        const templateId = EMAIL_CONFIG.TEMPLATE_ID;
        const publicKey = EMAIL_CONFIG.PUBLIC_KEY;
        const recipientEmail = EMAIL_CONFIG.RECIPIENT_EMAIL;

        if (!serviceId || !templateId || !publicKey || !recipientEmail) {
            setEmailError('EmailJS not configured. Please check emailConfig.ts');
            setEmailStatus('error');
            console.error('Missing EmailJS credentials in emailConfig.ts');
            return;
        }

        setEmailStatus('sending');
        setEmailError(null);

        try {
            const templateParams = {
                customer_name: customerDetails.name || 'Customer',
                customer_email: customerDetails.email || 'noreply@example.com',
                to_email: recipientEmail,
                email_html: assets.emailHtml
            };

                        const response = await emailjs.send(
                serviceId,
                templateId,
                templateParams,
                publicKey
            );

            console.log('✅ Email sent successfully:', response);
            
            // 🆕 Save order to Firebase
            try {
                await saveCurrentOrder();
                console.log('✅ Order saved to history');
            } catch (saveError) {
                console.error('❌ Failed to save order:', saveError);
            }
            
            setEmailStatus('sent');
            
            // Auto-close modal after 3 seconds on success
            setTimeout(() => {
                onClose();
                setEmailStatus('idle');
            }, 3000);

        } catch (error: any) {

            console.error('❌ EmailJS error:', error);
            setEmailStatus('error');
            setEmailError(error.text || 'Failed to send email. Please try again.');
        }
    };

    const getFileName = () => {
        const base = `${customerDetails.name || 'customer'}_${allDaysData[0]?.event || 'order'}`.replace(/[\s/]/g, '_');
        return `${base}.pdf`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Order" className="max-w-lg">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <SpinnerIcon className="w-12 h-12 text-indigo-400" />
                    <p className="mt-4 text-gray-300">Generating order...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Email Sending Section */}
                    <div className={`border-2 rounded-lg p-4 transition-all ${
                        emailStatus === 'sent' 
                            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/50'
                            : emailStatus === 'error'
                            ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-500/50'
                            : emailStatus === 'sending'
                            ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-500/50 animate-pulse'
                            : 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-500/50'
                    }`}>
                        <h3 className={`text-lg font-semibold mb-2 flex items-center ${
                            emailStatus === 'sent' ? 'text-green-400' 
                            : emailStatus === 'error' ? 'text-red-400'
                            : emailStatus === 'sending' ? 'text-blue-400'
                            : 'text-indigo-400'
                        }`}>
                            {emailStatus === 'sent' ? (
                                <>
                                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                                    ✓ Email Sent Successfully!
                                </>
                            ) : emailStatus === 'sending' ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5 mr-2" />
                                    Sending Email...
                                </>
                            ) : emailStatus === 'error' ? (
                                <>
                                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                                    ✗ Email Failed
                                </>
                            ) : (
                                <>
                                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                                    📧 Send Order to Nidy's
                                </>
                            )}
                        </h3>
                        
                        {emailStatus === 'sent' ? (
                            <div className="space-y-3">
                                <p className="text-sm text-green-300">
                                    ✅ Your order has been automatically sent to {EMAIL_CONFIG.RECIPIENT_EMAIL}
                                </p>
                                <div className="bg-green-800/30 border border-green-500/30 rounded-md p-3">
                                    <p className="text-xs text-green-200">
                                        The email includes all order details, customer information, and pricing. Closing automatically...
                                    </p>
                                </div>
                            </div>
                        ) : emailStatus === 'error' ? (
                            <div className="space-y-3">
                                <p className="text-sm text-red-300">
                                    {emailError || 'Failed to send email automatically.'}
                                </p>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={!assets.emailHtml}
                                    className="w-full flex justify-center items-center space-x-2 font-bold py-3 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <EnvelopeIcon className="w-5 h-5" />
                                    <span>Try Again</span>
                                </button>
                            </div>
                        ) : emailStatus === 'sending' ? (
                            <div className="space-y-3">
                                <p className="text-sm text-blue-300">
                                    Please wait while we send your order email...
                                </p>
                                <div className="bg-blue-800/30 border border-blue-500/30 rounded-md p-3">
                                    <p className="text-xs text-blue-200">
                                        This usually takes just a few seconds.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-300">
                                    Click below to automatically send this order to {EMAIL_CONFIG.RECIPIENT_EMAIL}.
                                </p>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={!assets.emailHtml}
                                    className="w-full flex justify-center items-center space-x-2 font-bold py-3 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <EnvelopeIcon className="w-5 h-5" />
                                    <span>Send Order to Nidy's</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Download PDF Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-amber-400 mb-2">Download PDF</h3>
                        <p className="text-sm text-gray-400 mb-4">Save a copy of the order summary for your records.</p>
                        <DownloadLink href={assets.pdfUrl} download={getFileName()}>
                            <ClipboardDocumentListIcon className="w-6 h-6 text-amber-400"/>
                            <div>
                                <p className="font-semibold">Order Summary (PDF)</p>
                                <p className="text-xs text-gray-400">Complete quote with all order details.</p>
                            </div>
                            <ArrowDownTrayIcon className="w-5 h-5 ml-auto"/>
                        </DownloadLink>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default SendOrderModal;