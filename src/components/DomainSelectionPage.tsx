import React from 'react';
import { Droplets, Recycle, Wind, Layers, ArrowLeft, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { ActiveDomain } from '../types/ecs';

interface DomainSelectionPageProps {
  onSelectDomain: (domain: ActiveDomain) => void;
  onBackToProject: () => void;
}

export const DomainSelectionPage: React.FC<DomainSelectionPageProps> = ({
  onSelectDomain,
  onBackToProject,
}) => {
  return (
    <div className="max-w-[1180px] mx-auto px-4 py-8 pb-20 animate-fadeIn space-y-8">
      {/* Top back action */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBackToProject}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thông tin dự án</span>
        </button>
      </div>

      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
          Chọn lĩnh vực thiết kế
        </h1>
        <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
          Chọn nhóm phân hệ kỹ thuật môi trường phù hợp với bài toán của công trình.
        </p>
      </div>

      {/* Grid of 4 Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* NƯỚC THẢI - HOÀN THIỆN ĐẦY ĐỦ */}
        <div
          onClick={() => onSelectDomain('wastewater')}
          className="p-6 rounded-2xl border-2 border-[#176b45] bg-gradient-to-br from-white via-[#f7fbf8] to-[#edf7f1] hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between gap-4 group relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#176b45] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
              <Recycle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#173a29]">Nước thải</h2>
                <span className="text-[10px] font-bold bg-[#e5f2e9] text-[#176b45] px-2 py-0.5 rounded-full border border-[#b8dbc3]">
                  Khuyên dùng
                </span>
              </div>
              <p className="text-xs text-[#55695e] leading-relaxed">
                Tính toán lưu lượng, tải lượng ô nhiễm (BOD, COD, TSS, TN, NH4, TP),
                chọn sơ đồ công nghệ và thiết kế kích thước chi tiết từng bể xử lý.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#d8e8dc] text-xs font-bold text-[#176b45]">
            <span>Mở không gian công cụ nước thải</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* NƯỚC CẤP */}
        <div
          onClick={() => onSelectDomain('water')}
          className="p-6 rounded-2xl border border-[#d6e2da] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Droplets className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#183a2a]">Nước cấp</h2>
                <span className="text-[10px] font-bold bg-[#e5f2e9] text-[#176b45] px-2 py-0.5 rounded-full border border-[#b8dbc3]">
                  Sẵn sàng
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Tính toán công suất trạm xử lý nước ngầm/mặt, bể trộn nhanh, bể phản ứng tạo bông có cánh khuấy,
                bể lắng lamen tải trọng cao, bể lọc nhanh cát thạch anh và khử trùng Clo.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-bold text-[#176b45]">
            <span>Mở thiết kế trạm nước cấp</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* KHÍ THẢI */}
        <div
          onClick={() => onSelectDomain('air')}
          className="p-6 rounded-2xl border border-[#d6e2da] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Wind className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#183a2a]">Khí thải</h2>
                <span className="text-[10px] font-bold bg-[#e5f2e9] text-[#176b45] px-2 py-0.5 rounded-full border border-[#b8dbc3]">
                  Sẵn sàng
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Tính toán thể tích khí sinh ra, đường kính chụp hút ACGIH, thủy lực tổn thất áp suất đường ống,
                chọn quạt ly tâm, tháp đệm hấp thụ Scrubber khử khí axit SOx, NOx, HCl và lọc bụi túi vải.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-bold text-[#176b45]">
            <span>Mở thiết kế xử lý khí thải</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>

        {/* CHẤT THẢI RẮN */}
        <div
          onClick={() => onSelectDomain('solidwaste')}
          className="p-6 rounded-2xl border border-[#d6e2da] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#183a2a]">Chất thải rắn</h2>
                <span className="text-[10px] font-bold bg-[#e5f2e9] text-[#176b45] px-2 py-0.5 rounded-full border border-[#b8dbc3]">
                  Sẵn sàng
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Dự báo khối lượng phát sinh rác thải sinh hoạt/công nghiệp, quy mô ô chôn lấp hợp vệ sinh (TCVN 6696:2009),
                dự báo nước rỉ rác cân bằng nước thủy văn và thiết kế nhà máy ủ phân compost.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-bold text-[#176b45]">
            <span>Mở thiết kế quản lý chất thải rắn</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
