import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { getDecimalDigits, setDecimalDigits } from '../utils/calculations';

interface StatusBarProps {
  currentProjectName: string;
  hasActiveProject: boolean;
  isDirty: boolean;
  lastSavedAt?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentProjectName,
  hasActiveProject,
  isDirty,
  lastSavedAt,
}) => {
  const [precision, setPrecision] = useState(() => getDecimalDigits());

  useEffect(() => {
    const handlePrecisionChange = (e: any) => {
      setPrecision(e?.detail?.digits ?? getDecimalDigits());
    };
    window.addEventListener('ecs-decimal-precision-changed', handlePrecisionChange);
    return () => window.removeEventListener('ecs-decimal-precision-changed', handlePrecisionChange);
  }, []);

  const cyclePrecision = () => {
    const next = precision === 1 ? 2 : 1;
    setDecimalDigits(next);
    setPrecision(next);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-7 bg-white border-t border-[#cfd9d2] px-4 flex items-center justify-between text-[11px] text-[#55695e] z-40 select-none shadow-sm">
      <div className="flex items-center gap-4 overflow-hidden truncate">
        <span className="font-semibold text-[#183b2b] hidden sm:inline">
          ECS — Environmental Calculation System
        </span>
        <span className="text-[#a0b0a6] hidden sm:inline">|</span>
        <span className="truncate">
          Dự án: <strong className="text-[#176b45]">{hasActiveProject ? currentProjectName : 'Chưa chọn'}</strong>
        </span>
        <span className="text-[#a0b0a6] hidden md:inline">|</span>
        <span className="hidden md:inline">Hệ quy chuẩn: SI / QCVN</span>
        <span className="text-[#a0b0a6] hidden lg:inline">|</span>
        <button
          type="button"
          onClick={cyclePrecision}
          className="hidden lg:inline hover:text-[#176b45] transition-colors cursor-pointer"
          title="Bấm để chuyển đổi giữa 1 và 2 chữ số thập phân"
        >
          Làm tròn: <strong className="text-[#176b45]">{precision === 1 ? '1 số thập phân (,0)' : '2 số thập phân (,00)'}</strong>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isDirty ? (
          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Có thay đổi chưa lưu
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[#176b45] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#176b45]" />
            {hasActiveProject ? 'Đã lưu trên thiết bị' : 'Sẵn sàng'}
          </span>
        )}
        {lastSavedAt && (
          <span className="text-[10px] text-[#788a80] hidden lg:inline">
            ({new Date(lastSavedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
          </span>
        )}
      </div>
    </footer>
  );
};
