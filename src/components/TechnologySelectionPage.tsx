import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Copy, Trash2, CheckSquare, Plus, Check } from 'lucide-react';
import { TechnologyUnit } from '../types/ecs';

interface TechnologySelectionPageProps {
  units: TechnologyUnit[];
  onAddUnit: (catalogName: string) => void;
  onRemoveCatalogType: (catalogName: string) => void;
  onRemoveUnit: (id: string) => void;
  onDuplicateUnit: (unit: TechnologyUnit) => void;
  onRenameUnit: (id: string, newName: string) => void;
  onBack: () => void;
}

export const TECHNOLOGY_CATALOG = [
  { group: 'Thu gom – điều hòa', items: ['Bể điều hòa', 'Hầm bơm'] },
  { group: 'Xử lý cơ học', items: ['Song chắn rác', 'Bể lắng cát', 'Bể tách dầu mỡ'] },
  { group: 'Hóa lý', items: ['Bể phản ứng', 'Bể keo tụ', 'Bể tạo bông', 'Bể tuyển nổi DAF'] },
  { group: 'Sinh học', items: ['Bể Anoxic', 'Bể Aerotank', 'Bể SBR', 'Bể MBR', 'Bể MBBR', 'Bể UASB'] },
  { group: 'Lắng – lọc', items: ['Bể lắng sinh học', 'Bể lắng hóa lý', 'Bể lọc áp lực', 'Lọc than hoạt tính'] },
  { group: 'Khử trùng', items: ['Bể khử trùng'] },
  { group: 'Xử lý bùn', items: ['Bể chứa bùn', 'Bể nén bùn', 'Máy ép bùn'] },
];

export const TechnologySelectionPage: React.FC<TechnologySelectionPageProps> = ({
  units,
  onAddUnit,
  onRemoveCatalogType,
  onRemoveUnit,
  onDuplicateUnit,
  onRenameUnit,
  onBack,
}) => {
  const [confirmDialog, setConfirmDialog] = React.useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Close confirmation modal on Escape key
  useEffect(() => {
    if (!confirmDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmDialog(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog]);

  const requestRemoveUnit = (unit: TechnologyUnit) => {
    setConfirmDialog({
      title: 'Xóa công trình',
      message: `Xóa "${unit.name}" và toàn bộ dữ liệu tính toán liên quan khỏi dây chuyền?`,
      onConfirm: () => {
        onRemoveUnit(unit.id);
        setConfirmDialog(null);
      },
    });
  };

  const requestRemoveCatalogType = (itemName: string, count: number) => {
    setConfirmDialog({
      title: 'Bỏ chọn công trình',
      message:
        count > 1
          ? `Bỏ chọn ${count} công trình thuộc loại "${itemName}" và xóa toàn bộ dữ liệu tính toán liên quan?`
          : `Bỏ chọn công trình "${itemName}" và xóa toàn bộ dữ liệu tính toán liên quan?`,
      onConfirm: () => {
        onRemoveCatalogType(itemName);
        setConfirmDialog(null);
      },
    });
  };
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 pb-20 animate-fadeIn space-y-6">
      {/* Top back bar */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>
      </div>

      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#193d2c]">Chọn công nghệ</h1>
        <p className="text-xs sm:text-sm text-[#64786d] leading-relaxed">
          Chọn các công trình đơn vị theo dây chuyền công nghệ xử lý. Thay đổi được tự động cập nhật vào dự án.
        </p>
      </div>

      {/* Catalog Groups */}
      <div className="space-y-4">
        {TECHNOLOGY_CATALOG.map((grp) => (
          <section
            key={grp.group}
            className="p-5 rounded-2xl border border-[#d6e2da] bg-white shadow-xs space-y-3.5"
          >
            <h2 className="text-sm font-bold text-[#1a3d2c] flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#176b45] rounded-full inline-block" />
              <span>{grp.group}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {grp.items.map((itemName) => {
                const count = units.filter((u) => u.catalogName === itemName).length;
                const isSelected = count > 0;

                return (
                  <div
                    key={itemName}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'border-[#9ec4ad] bg-[#f2f8f4] text-[#1b432e] shadow-xs'
                        : 'border-[#dce6e0] bg-[#fcfdfe] text-[#3e5648] hover:border-[#b0cfbc]'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onAddUnit(itemName);
                          } else {
                            requestRemoveCatalogType(itemName, count);
                          }
                        }}
                        className="w-4 h-4 rounded text-[#176b45] accent-[#176b45] cursor-pointer"
                      />
                      <span className="font-semibold">{itemName}</span>
                    </label>

                    {isSelected && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#176b45] text-white">
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Selected Units Panel */}
        <section className="p-5 rounded-2xl border-2 border-[#b5d5c0] bg-gradient-to-br from-white to-[#f5fbf7] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#173a29] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#176b45]" />
                <span>Danh sách công trình đã chọn ({units.length})</span>
              </h2>
              <p className="text-xs text-[#5d7366] mt-0.5">
                Bạn có thể đổi tên hiển thị, nhân đôi hoặc xóa từng công trình
              </p>
            </div>
          </div>

          {units.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6e8276] border border-dashed border-[#ccdcd1] rounded-xl bg-white">
              Chưa chọn công trình nào. Tích chọn các công trình ở danh mục phía trên để lập dây chuyền công nghệ.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3 rounded-xl border border-[#cbe0d3] bg-white shadow-xs flex items-center justify-between gap-2"
                >
                  <input
                    type="text"
                    value={unit.name}
                    onChange={(e) => onRenameUnit(unit.id, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#d3dfd7] text-xs font-bold text-[#183a2a] focus:border-[#176b45] focus:ring-1 focus:ring-[#176b45] bg-[#fafcfb]"
                    title="Nhấn để sửa tên công trình"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateUnit(unit)}
                      className="p-1.5 rounded-lg border border-[#c4dcce] text-[#176b45] hover:bg-[#eaf4ed] transition-colors"
                      title="Nhân đôi công trình"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestRemoveUnit(unit)}
                      className="p-1.5 rounded-lg border border-[#eed2d0] text-[#a8342f] hover:bg-[#fdeeed] transition-colors"
                      title="Xóa công trình"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-[#d6e2da] bg-white">
        <div className="text-xs font-bold text-[#455c4e]">
          Đã chọn tổng cộng: <span className="text-[#176b45]">{units.length} công trình</span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>
      </div>

      {/* Confirmation Modal - Rendered via Portal directly to document.body to avoid CSS transform traps */}
      {confirmDialog &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmDialog(null);
            }}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#d6e2da] p-6 space-y-4 animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-[#183a2a]">{confirmDialog.title}</h2>
                <p className="text-xs text-[#5c7265] leading-relaxed">{confirmDialog.message}</p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-xl border border-[#cbd8d0] bg-white text-xs font-semibold text-[#405649] hover:bg-[#f4f7f5] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmDialog.onConfirm();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-sm transition-all cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
