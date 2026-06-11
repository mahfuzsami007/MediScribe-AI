import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PrescriptionPreview({ data, doctor, fullPage = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const previewRef = useRef(null);

  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const pid = `RX-${Date.now().toString().slice(-6)}`;

  // Fallback values for clinic info
  const clinicName = doctor.clinic_name || 'MediScribe Clinic';
  const clinicPhone = doctor.clinic_phone || '+880 1700-000000';
  const clinicAddress = doctor.clinic_address || '123 Medical Quarter, Dhaka 1200';
  const doctorName = doctor.name || 'Doctor';
  const doctorSpecialty = doctor.specialty || 'Physician';
  const doctorReg = doctor.reg || '---';

  // ---------- Helper: Convert OKLCH strings to safe browser HEX Fallbacks ----------
  const forceSafeColorsOnClone = (clonedDoc) => {
    const colorMap = {
      'bg-blue-600': '#2563eb',
      'text-blue-600': '#2563eb',
      'bg-blue-50': '#eff6ff',
      'text-slate-800': '#1e293b',
      'text-slate-700': '#334155',
      'text-slate-500': '#64748b',
      'text-slate-400': '#94a3b8',
      'bg-slate-50': '#f8fafc',
      'border-slate-200': '#e2e8f0',
      'border-blue-600': '#2563eb',
      'bg-green-50': '#f0fdf4',
      'text-green-700': '#15803d',
      'bg-red-50': '#fef2f2',
      'text-red-600': '#dc2626',
      'bg-purple-50': '#faf5ff',
      'text-purple-600': '#9333ea',
    };

    const allElements = clonedDoc.querySelectorAll('*');
    allElements.forEach((el) => {
      el.classList.forEach((className) => {
        if (colorMap[className]) {
          if (className.startsWith('bg-')) el.style.backgroundColor = colorMap[className];
          if (className.startsWith('text-')) el.style.color = colorMap[className];
          if (className.startsWith('border-')) el.style.borderColor = colorMap[className];
        }
      });

      const computed = window.getComputedStyle(el);
      if (computed.color && computed.color.includes('oklch')) el.style.color = '#1e293b';
      if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) el.style.backgroundColor = '#ffffff';
      if (computed.borderColor && computed.borderColor.includes('oklch')) el.style.borderColor = '#e2e8f0';
    });
  };

  // ---------- Helper: generate PDF Blob ----------
  const generatePdfBlob = async () => {
    if (!previewRef.current) throw new Error('Preview not available');

    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      onclone: (clonedDoc) => {
        forceSafeColorsOnClone(clonedDoc);
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    return pdf.output('blob');
  };

  // ---------- QR code PDF generation & upload ----------
  const generateAndUploadPrescription = async () => {
    setIsUploading(true);
    try {
      const pdfBlob = await generatePdfBlob();
      const formData = new FormData();
      formData.append('file', pdfBlob, 'prescription.pdf');

      const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.data?.url) throw new Error('Upload failed');

      const directUrl = uploadData.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      setDownloadUrl(directUrl);
      setShowQrModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to generate or upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const Section = ({ title, children }) => (
    <div className={fullPage ? 'mb-5' : 'mb-3'}>
      <div className={`mb-1.5 flex items-center gap-2 font-bold uppercase tracking-wider text-slate-400 ${fullPage ? 'text-[10px]' : 'text-[9px]'}`}>
        {title}
        <div className="flex-1 border-t border-slate-100" />
      </div>
      <div className={`leading-relaxed whitespace-pre-wrap text-slate-700 ${fullPage ? 'text-[13px]' : 'text-[11px]'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${fullPage ? 'shadow-md' : ''}`}>
        <div className={`flex items-center gap-3 bg-blue-600 ${fullPage ? 'px-8 py-5' : 'px-5 py-3.5'}`}>
          <span className={fullPage ? 'text-2xl' : 'text-lg'}>📋</span>
          <div>
            <h4 className={`font-bold text-white ${fullPage ? 'text-[16px]' : 'text-[13px]'}`}>
              {fullPage ? 'Prescription' : 'Live Preview'}
            </h4>
            <p className={`text-blue-200 ${fullPage ? 'text-[12px]' : 'text-[10px]'}`}>
              {fullPage ? 'Review before sharing' : 'Updates as you speak'}
            </p>
          </div>
        </div>

        <div ref={previewRef} id="rx-doc-print" className={fullPage ? 'px-9 py-8' : 'px-5 py-4'}>
          {/* Clinic header with dynamic doctor and clinic info */}
          <div className={`border-b-2 border-blue-600 ${fullPage ? 'mb-6 pb-5' : 'mb-3 pb-3'}`}>
            <h3 className={`font-bold text-slate-800 ${fullPage ? 'text-[18px]' : 'text-[13px]'}`} style={{ fontFamily: 'IBM Plex Serif, serif' }}>
              {doctorName}
            </h3>
            <p className={`mt-0.5 text-slate-500 ${fullPage ? 'text-[12px]' : 'text-[10px]'}`}>
              {doctorSpecialty} · Reg: {doctorReg}
            </p>
            <p className={`text-slate-500 ${fullPage ? 'text-[12px]' : 'text-[10px]'}`}>
              {clinicName} · {clinicPhone}
            </p>
            <p className={`text-slate-500 ${fullPage ? 'text-[12px]' : 'text-[10px]'}`}>
              {clinicAddress}
            </p>
          </div>

          <div className={`mb-5 grid grid-cols-3 rounded-xl bg-slate-50 ${fullPage ? 'gap-4 p-4' : 'gap-2.5 p-3'}`}>
            {[
              { l: 'Patient',    v: data.patient?.name || '—' },
              { l: 'Age/Gender', v: `${data.patient?.age ? data.patient.age + 'Y' : '—'} / ${data.patient?.gender || '—'}` },
              { l: 'Date',       v: today },
              { l: 'BP',         v: data.vitals?.bp     || '—' },
              { l: 'Weight',     v: data.vitals?.weight || '—' },
              { l: 'Rx No.',     v: pid },
            ].map(item => (
              <div key={item.l}>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{item.l}</span>
                <strong className={`font-semibold text-slate-800 ${fullPage ? 'text-[13px]' : 'text-[11px]'}`}>{item.v}</strong>
              </div>
            ))}
          </div>

          {data.symptoms?.chief      && <Section title="Chief Complaints">{data.symptoms.chief}</Section>}
          {data.symptoms?.findings   && <Section title="Examination">{data.symptoms.findings}</Section>}

          {data.medications?.meds && (
            <div className={fullPage ? 'mb-5' : 'mb-3'}>
              <span className={`block font-semibold italic text-blue-600 ${fullPage ? 'mb-2.5 text-[28px]' : 'mb-1.5 text-[18px]'}`} style={{ fontFamily: 'IBM Plex Serif, serif' }}>℞</span>
              <div className={`leading-relaxed whitespace-pre-wrap text-slate-700 ${fullPage ? 'text-[13px]' : 'text-[11px]'}`}>
                {data.medications.meds}
              </div>
            </div>
          )}

          {data.investigations?.tests && <Section title="Investigations">{data.investigations.tests}</Section>}
          {data.habits?.advice        && <Section title="Advice">{data.habits.advice}</Section>}

          <div className={`flex items-end justify-between border-t border-slate-200 ${fullPage ? 'mt-6 pt-6' : 'mt-4 pt-4'}`}>
            <div className={`text-slate-400 ${fullPage ? 'text-[11px]' : 'text-[9px]'}`}>
              Date: {today}<br />
              <span className={fullPage ? 'text-[10px]' : 'text-[8px]'}>Next visit: 7 days</span>
            </div>
            <div className={`border-t-[1.5px] border-slate-700 pt-2 text-center text-slate-500 ${fullPage ? 'w-44 text-[11px]' : 'w-28 text-[9px]'}`}>
              {doctorName}<br />
              <span className={fullPage ? 'text-[9px]' : 'text-[8px]'}>{doctorSpecialty}</span>
            </div>
          </div>
        </div>

        <div className={`border-t border-slate-100 ${fullPage ? 'px-9 py-6' : 'px-5 py-4'}`}>
          {fullPage && <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Share Prescription</p>}
          <div className={`gap-2.5 ${fullPage ? 'grid grid-cols-2' : 'flex flex-col'}`}>
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-bold text-red-600 transition hover:brightness-95"
            >
              📄 Save as PDF
            </button>
            <button
              onClick={generateAndUploadPrescription}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5 text-[12px] font-bold text-purple-600 transition hover:brightness-95 disabled:opacity-50"
            >
              {isUploading ? '⏳ Uploading...' : '📱 QR PDF'}
            </button>
          </div>
        </div>
      </div>

      {showQrModal && downloadUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl text-center">
            <button onClick={() => setShowQrModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">✕</button>
            <h3 className="text-lg font-bold mb-2">Prescription PDF ready</h3>
            <p className="text-xs text-slate-500 mb-4">Scan to download instantly</p>
            <div className="flex justify-center">
              <QRCodeSVG value={downloadUrl} size={256} level="M" includeMargin={true} />
            </div>
            <p className="mt-4 text-xs text-slate-400 break-all">{downloadUrl.substring(0, 60)}…</p>
            <a href={downloadUrl} download className="mt-6 inline-block w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 text-center">
              Direct download
            </a>
          </div>
        </div>
      )}
    </>
  );
}