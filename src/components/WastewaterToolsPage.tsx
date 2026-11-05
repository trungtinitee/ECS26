import React from 'react';
import {
  FileSpreadsheet,
  Workflow,
  Compass,
  FileCheck2,
  Wrench,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { WastewaterTool } from '../types/ecs';

interface WastewaterToolsPageProps {
  onSelectTool: (tool: WastewaterTool) => void;
  onBackToDomains: () => void;
  selectedUnitsCount: number;
}

export const WastewaterToolsPage: React.FC<WastewaterToolsPageProps> = ({
  onSelectTool,
  onBackToDomains,
  selectedUnitsCount,
}) => {
  return (
    <div className="max-w-[1180px] mx-auto px-4 py-8 pb-20 animate-fadeIn space-y-8">
      {/* Back button */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBackToDomains}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại 4 lĩnh vực</span>
        </button>
      </div>

      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#176b45]">
          PHÂN HỆ KỸ THUẬT NƯỚC THẢI
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#193d2c] tracking-tight">
          Công cụ thiết kế nước thải
        </h1>
        <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
          Chọn nhóm chức năng để tiếp tục làm việc trong dự án hiện tại.
        </p>
      </div>

      {/* Grid of 5 Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. TẢI LƯỢNG */}
        <div
          onClick={() => onSelectTool('load')}
          className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                Tải lượng
              </h2>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Nhập thông số đầu vào và tính lưu lượng ngày/giờ/phút, tải lượng ô nhiễm BOD, COD, TSS, Nitơ, Phốt pho.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Mở công cụ tải lượng</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. CHỌN CÔNG NGHỆ */}
        <div
          onClick={() => onSelectTool('technology')}
          className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Workflow className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                  Chọn công nghệ
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f6f2] text-[#245738] border border-[#d3e3d8]">
                  {selectedUnitsCount} công trình
                </span>
              </div>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Thư viện các công trình đơn vị: Thu gom, Điều hòa, Cơ học, Hóa lý, Sinh học hiếu khí/kỵ khí, Khử trùng, Xử lý bùn.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Chọn & quản lý công trình</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. TÍNH TOÁN CHI TIẾT TỪNG CÔNG TRÌNH */}
        <div
          onClick={() => onSelectTool('units')}
          className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                Tính toán chi tiết
              </h2>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Tính kích thước thông thủy (L × B × H hoặc D × H), kiểm tra dung tích thực tế, diện tích mặt thoáng và công suất thiết bị.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Mở tính toán chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. BÁO CÁO THUYẾT MINH */}
        <div
          onClick={() => onSelectTool('reports')}
          className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                Báo cáo tổng hợp
              </h2>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Tổng hợp toàn bộ thuyết minh kỹ thuật, bảng dữ liệu đầu vào, kết quả tính tải lượng và kích thước dây chuyền xử lý để in ấn/xuất file.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Xem thuyết minh kỹ thuật</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 5. CÔNG CỤ TIỆN ÍCH */}
        <div
          onClick={() => onSelectTool('tools')}
          className="p-6 rounded-2xl border border-[#cfded4] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-4 group"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#e6f3eb] text-[#176b45] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#183a2a] group-hover:text-[#176b45]">
                Tiện ích & Tra cứu
              </h2>
              <p className="text-xs text-[#63776d] leading-relaxed">
                Quy đổi đơn vị (m³/h, L/s), tra cứu QCVN 14/40, tính cân bằng dinh dưỡng BOD:N:P và nồng độ bùn hoạt tính.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#edf3ef] text-xs font-semibold text-[#176b45]">
            <span>Mở công cụ tính nhanh</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
