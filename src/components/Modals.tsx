import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, X, ArrowLeft } from 'lucide-react';

interface SaveDecisionModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const SaveDecisionModal: React.FC<SaveDecisionModalProps> = ({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#d6e3da] p-6 space-y-4 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#183a2a]">Dự án chưa lưu</h2>
          <p className="text-xs text-[#5c7265] leading-relaxed">
            Bạn có thay đổi chưa được lưu vào bộ nhớ. Bạn có muốn lưu lại trước khi tiếp tục?
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="px-3.5 py-2 rounded-xl border border-[#d6e2da] bg-white text-xs font-semibold text-[#405649] hover:bg-[#f4f7f5] transition-colors cursor-pointer"
          >
            Không lưu
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-[#176b45] text-white text-xs font-bold hover:bg-[#105a39] shadow-sm transition-all cursor-pointer"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface DeleteConfirmModalProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-100 p-6 space-y-4 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#193a29]">Xóa dự án?</h2>
            <p className="text-xs text-[#5d7064]">Thao tác này sẽ xóa vĩnh viễn khỏi thiết bị này</p>
          </div>
        </div>

        <p className="text-xs text-[#4b5f53] leading-relaxed bg-[#fff8f8] p-3 rounded-xl border border-red-100">
          Bạn sắp xóa <strong>“{projectName}”</strong> khỏi danh sách dự án đã lưu trên trình duyệt. Thao tác này không thể hoàn tác.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold text-[#3b5245] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm transition-all cursor-pointer"
          >
            Xóa dự án
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface ComingSoonViewProps {
  title: string;
  icon: string;
  description: string;
  onBackToDomains: () => void;
  onBackToProject: () => void;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({
  title,
  icon,
  description,
  onBackToDomains,
  onBackToProject,
}) => {
  return (
    <div className="max-w-[720px] mx-auto px-4 py-16 animate-fadeIn text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-[#e6f3eb] text-3xl flex items-center justify-center shadow-xs">
        {icon}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-[#183a2a]">Nhóm công cụ {title}</h1>
        <p className="text-xs sm:text-sm text-[#61756a] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#f4f7f5] border border-[#d7e3da] text-xs text-[#486052] max-w-lg mx-auto">
        Hiện tại phân hệ <strong>Nước thải</strong> đã được hoàn thiện đầy đủ mọi tính năng tính toán tải lượng, chọn công nghệ và thiết kế công trình chi tiết.
      </div>

      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          type="button"
          onClick={onBackToDomains}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Chọn lĩnh vực khác</span>
        </button>

        <button
          type="button"
          onClick={onBackToProject}
          className="px-4 py-2 rounded-xl bg-[#176b45] text-white text-xs font-semibold hover:bg-[#105a39]"
        >
          Thông tin dự án
        </button>
      </div>
    </div>
  );
};
