import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ArrowRightLeft,
  Zap,
  Wind,
  FlaskConical,
  Waves,
  Gauge,
} from 'lucide-react';
import { PumpCalculator } from './tools/PumpCalculator';
import { BlowerCalculator } from './tools/BlowerCalculator';
import { ChemicalCalculator } from './tools/ChemicalCalculator';
import { HydraulicCalculator } from './tools/HydraulicCalculator';
import { ElectricalCalculator } from './tools/ElectricalCalculator';
import { UnitConverter } from './tools/UnitConverter';

interface ToolsPageProps {
  onBack: () => void;
  currentQavg?: number;
  currentBod?: number;
  currentTn?: number;
  currentTp?: number;
}

type ToolId = 'pump' | 'blower' | 'chemical' | 'hydraulic' | 'electrical' | 'unit';

interface ToolItem {
  id: ToolId;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
}

const TOOLS_LIST: ToolItem[] = [
  {
    id: 'pump',
    title: 'Bơm',
    subtitle: 'Tính cột áp Hgeo, tổn thất Hazen-Williams, chọn công suất bơm & dòng điện 380V',
    badge: 'Cột áp & Công suất',
    icon: Gauge,
  },
  {
    id: 'blower',
    title: 'Oxy / Blower',
    subtitle: 'Cân bằng AOR/SOR Metcalf & Eddy, tính m³/phút khí, áp lực kPa & số đĩa bọt mịn',
    badge: 'Khí & Sục khí',
    icon: Wind,
  },
  {
    id: 'chemical',
    title: 'Hóa chất',
    subtitle: 'Tính liều lượng PAC, PAM, Javel, NaOH, rỉ mật; công thức pha bồn & bơm định lượng',
    badge: 'Keo tụ & Pha chế',
    icon: FlaskConical,
  },
  {
    id: 'hydraulic',
    title: 'Thủy lực',
    subtitle: 'Ống áp lực, mương hở tự chảy Manning & máng tràn răng cưa tam giác 90° Thompson',
    badge: 'Mương & Máng tràn',
    icon: Waves,
  },
  {
    id: 'electrical',
    title: 'Điện',
    subtitle: 'Tổng Pđặt, Ptt, dòng điện Itt, chọn MCCB, tiết diện cáp đồng & chi phí điện EVN',
    badge: 'Ptt & Chi phí EVN',
    icon: Zap,
  },
  {
    id: 'unit',
    title: 'Đổi đơn vị',
    subtitle: 'Quy đổi Lưu lượng, Áp suất, Nồng độ, Vận tốc, Công suất & tính nhanh tải trọng kg/ngày',
    badge: 'Quy đổi kỹ thuật',
    icon: ArrowRightLeft,
  },
];

export const ToolsPage: React.FC<ToolsPageProps> = ({
  onBack,
  currentQavg = 100,
  currentBod = 250,
  currentTn = 40,
  currentTp = 8,
}) => {
  // selectedTool: null means user is at the 6-cards menu view. When a tool is clicked, it opens only that tool!
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);

  const currentToolObj = TOOLS_LIST.find((t) => t.id === selectedTool);

  // ==========================================
  // VIEW 2: WHEN A UTILITY IS OPENED
  // ==========================================
  if (selectedTool) {
    return (
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 py-5 pb-24 animate-fadeIn space-y-6">
        {/* Navigation Bar inside the opened utility */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#d6e3db] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedTool(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-bold hover:bg-[#eaf3ee] hover:border-[#176b45] transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Quay lại danh sách tiện ích</span>
            </button>

            <div className="h-5 w-[1px] bg-gray-200 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Đang mở:</span>
              <span className="text-sm font-extrabold text-[#176b45]">
                {currentToolObj?.title}
              </span>
            </div>
          </div>

          {/* Quick jump to another tool without full reload */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden md:inline">
              Chuyển nhanh tiện ích:
            </span>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value as ToolId)}
              className="px-3 py-1.5 rounded-xl border border-[#cbd8d0] text-xs font-bold text-[#183a2a] bg-white cursor-pointer"
            >
              {TOOLS_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* The calculation component occupies the whole view */}
        <div className="animate-fadeIn">
          {selectedTool === 'pump' && (
            <PumpCalculator initialQ={currentQavg > 0 ? currentQavg / 24 : 15} />
          )}

          {selectedTool === 'blower' && (
            <BlowerCalculator
              initialQ={currentQavg}
              initialBod={currentBod}
              initialTn={currentTn}
            />
          )}

          {selectedTool === 'chemical' && (
            <ChemicalCalculator initialQ={currentQavg} />
          )}

          {selectedTool === 'hydraulic' && (
            <HydraulicCalculator initialQ={currentQavg > 0 ? currentQavg / 24 : 20} />
          )}

          {selectedTool === 'electrical' && (
            <ElectricalCalculator flow_m3d={currentQavg} />
          )}

          {selectedTool === 'unit' && (
            <UnitConverter initialFlow={currentQavg} />
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: MAIN SELECTION MENU (EXACTLY AS IN PHOTO)
  // ==========================================
  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-6 pb-24 animate-fadeIn space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-bold hover:bg-[#eaf3ee] hover:border-[#176b45] transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại thiết kế nước thải</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#526d5d]">
          <span className="font-medium">Thông số dự án:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#176b45] font-bold border border-emerald-200">
            Q = {currentQavg} m³/ngày
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#176b45] font-bold border border-emerald-200 hidden sm:inline">
            BOD = {currentBod} mg/L
          </span>
        </div>
      </div>

      {/* Main Container of the 6 Choice Cards matching the photo */}
      <div className="space-y-4">
        <div className="text-left space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#193d2c]">
            Tiện ích thiết kế nước thải
          </h1>
          <p className="text-xs sm:text-sm text-[#5d7568]">
            Chọn một tiện ích bên dưới để mở giao diện tính toán chi tiết
          </p>
        </div>

        {/* The 6 Choice Cards in 2 columns x 3 rows grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
          {TOOLS_LIST.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSelectedTool(tool.id)}
                className="group relative flex items-center justify-between p-5 sm:p-6 rounded-[22px] bg-white border border-[#d3ded7] hover:border-[#176b45] hover:shadow-md transition-all duration-200 text-left cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-4">
                  {/* Icon badge */}
                  <div className="w-11 h-11 rounded-2xl bg-[#edf6f1] text-[#176b45] group-hover:bg-[#176b45] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title & brief hint */}
                  <div className="space-y-0.5">
                    <div className="text-base sm:text-lg font-bold text-[#1a382a] group-hover:text-[#176b45] transition-colors">
                      {tool.title}
                    </div>
                    <div className="text-xs text-[#627a6d] line-clamp-1">
                      {tool.subtitle}
                    </div>
                  </div>
                </div>

                {/* Right Arrow indicator */}
                <div className="w-8 h-8 rounded-full bg-[#f4f8f5] group-hover:bg-[#e4f1ea] flex items-center justify-center text-[#2b583f] group-hover:text-[#176b45] transition-colors shrink-0 ml-3">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
