/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { formatRial, toPersianDigits, formatDecimal } from '../utils/numberUtils';
import { FileText, Printer, ShieldCheck, CheckCircle, Info, Loader2 } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

interface SummarySectionProps {
  selectedClusterName: string;
  selectedDecileName: string;
  standardHours: number;
  dailyHours: number;
  totalDays: number;
  sumOfRowCosts: number;
  dailyTableCost: number;
  totalTieredCost: number;
  registrationExamCost: number;
  certificateIssuanceCost: number;
  grandTotal: number;
  onReset: () => void;
  calculatedTable1Rows: any[];
  baseClusterTariff: number;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
  selectedClusterName,
  selectedDecileName,
  standardHours,
  dailyHours,
  totalDays,
  sumOfRowCosts,
  dailyTableCost,
  totalTieredCost,
  registrationExamCost,
  certificateIssuanceCost,
  grandTotal,
  onReset,
  calculatedTable1Rows,
  baseClusterTariff,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePrint = () => {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.error("Print error, fallback to direct print:", e);
      window.print();
    }
  };

  const formatToFarsi = (value: number): string => {
    const rounded = Math.round(value);
    const formattedString = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return toPersianDigits(formattedString);
  };

  const handleGenerateDocx = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/template.docx');
      if (!response.ok) {
        throw new Error('فایل قالب قرارداد (template.docx) پیدا نشد. لطفا مطمئن شوید این فایل در پوشه public قرار دارد.');
      }
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const docData: Record<string, any> = {
        mojri_name: "شرکت آموزشی تست",
        center_name: "برادران گرگان",
        mojri_rep: "علی علوی",
        mojri_title: "مدیرعامل",
        mojri_address: "گرگان، خیابان ولیعصر، پلاک ۱۲",
        mojri_phone: "01732222222",
        course_count: "۱",
        course_name: "برنامه‌نویسی پایتون",
        standard_code: "1234-56",
        target_audience: "متقاضیان آزاد",
        funding_source: "متقاضی آزاد",
        payer_type: "کارآموز",
        exam_field: "فناوری اطلاعات",
        start_date: "1405/04/01",
        end_date: "1405/05/01",
        teacher_name: "محمد رضایی",
        week_days: "روزهای زوج",
        
        standard_hours: toPersianDigits(standardHours),
        student_count: "۱۵",
        total_person_hours: toPersianDigits(standardHours * 15),
        grand_total: formatToFarsi(grandTotal),
        reg_fee_per_person: formatToFarsi(1000000),
        consult_fee_per_person: formatToFarsi(600000),
        total_reg_consult_per_person: formatToFarsi(1600000),
        total_reg_consult_all: formatToFarsi(1600000 * 15),
        tiered_cost_per_person: formatToFarsi(totalTieredCost / 15),
        total_tiered_cost: formatToFarsi(totalTieredCost),
        exam_fee_per_person: formatToFarsi(1000000),
        total_exam_fee: formatToFarsi(1000000 * 15),
        total_cert_fee: formatToFarsi(1500000 * 15),
        total_days: toPersianDigits(totalDays.toFixed(2)),
        cost_per_person_day: formatToFarsi(dailyTableCost / 15),
        total_course_amount: formatToFarsi(dailyTableCost),
        
        cluster_header: "تعرفه‌های مصوب در خوشه انتخابی به ازای هر نفر - روز",
        base_tariff: formatToFarsi(baseClusterTariff),
        table1_total: formatToFarsi(dailyTableCost),
      };

      calculatedTable1Rows.forEach((row, index) => {
        docData[`req_${index + 1}`] = row.isApplicant ? "☑" : "-";
        docData[`voc_${index + 1}`] = row.isVocational ? "☑" : "-";
        docData[`w_${index + 1}`] = toPersianDigits(row.weightPercentage);
        docData[`row${index + 1}_cost`] = formatToFarsi(row.rowCost || 0);
      });

      doc.render(docData);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      saveAs(out, 'test-gharardad.docx');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || 'خطایی در تولید سند رخ داده است.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 print:border-none print:shadow-none" id="summary-section-container">
      {/* Accent line & Title */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800" id="summary-title">هزینه نهایی اجرای دوره برای هر نفر</h2>
          <p className="text-slate-400 text-xs mt-0.5">تفکیک پرداخت و مبالغ نهایی مصوب کل دوره.</p>
        </div>
        <div className="flex gap-2 items-center print:hidden">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            تست خروجی قرارداد (Word)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-bold text-[10px] transition-all cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            نسخه چاپی
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-650 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile info pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">خوشه انتخابی:</span>
          <span className="font-extrabold text-slate-800 text-[13px]">{selectedClusterName}</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">شاخص دهک:</span>
          <span className="font-extrabold text-slate-800 text-[13px]">{selectedDecileName}</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">ساعت استاندارد آموزش:</span>
          <span className="font-black text-slate-900 text-[13px]">{toPersianDigits(standardHours)} ساعت</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block font-medium">تعداد روز برگزاری دوره:</span>
          <span className="font-black text-slate-900 text-[13px]">
            {dailyHours > 0 && standardHours > 0 ? `${formatDecimal(totalDays, 2)} روز` : '۰ روز'}
          </span>
        </div>
      </div>

      {/* Piecewise Itemized Costing */}
      <div className="space-y-3 text-[13px] sm:text-[14px]">
        {/* Item 1: Workshop cost */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
          <span className="text-slate-700 font-extrabold">۱. مبلغ کل قرارداد ( بدون احتساب هزینه صدور گواهینامه ):</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(dailyTableCost)}</span>
        </div>

        {/* Item 2: Tiered cost */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
          <span className="text-slate-700 font-extrabold">۲. هزینه حق الزحمه ارائه خدمات آموزشی ( براساس دهک بندی متقاضی):</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(totalTieredCost)}</span>
        </div>

        {/* Item 3: Reg Cost */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100/80">
          <span className="text-slate-700 font-extrabold">۳. هزینه ثبت نام /مشاوره/ ورود به آزمون:</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(registrationExamCost)}</span>
        </div>

        {/* Item 4: Issuance Cost */}
        <div className="flex justify-between items-center py-2 text-slate-700">
          <span className="font-extrabold">۴. هزینه صدور گواهینامه:</span>
          <span className="font-black font-sans text-slate-900 text-[15px] sm:text-base">{formatRial(certificateIssuanceCost)}</span>
        </div>
      </div>

      {/* Grand Total Highlight Badge */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-4 rounded-xl space-y-1 text-center relative overflow-hidden shadow-sm">
        <span className="text-[10px] text-blue-200 block uppercase font-bold tracking-wider">هزینه کل محاسبه شده برای هر نفر:</span>
        <span className="text-2xl font-black font-sans tracking-tight block" id="grand-total-display">
          {formatRial(grandTotal)}
        </span>
        <span className="text-[9px] text-emerald-400 block">تایید شده بر مبنای نرخ‌نامه‌های ابلاغی ۱۴۰۵</span>
      </div>

      {/* Secondary Information & reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] pt-1.5 print:hidden">
        <span className="text-slate-450 leading-relaxed">
          امکان ویرایش زنده مقادیر در بالا وجود دارد. 
          <span className="text-blue-600 font-bold mr-1 block sm:inline">
            (در صورت عدم باز شدن صفحه چاپ به دلیل مسائل امنیتی مرورگر، لطفا از کلیدهای میانبر <span dir="ltr">Ctrl+P</span> استفاده کنید یا برنامه را در تب جدید باز نمایید.)
          </span>
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-red-500 hover:text-red-700 font-bold transition-all cursor-pointer shrink-0"
        >
          پاک کردن همه مقادیر
        </button>
      </div>
    </div>
  );
};
