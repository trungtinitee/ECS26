import React from 'react';
import { Save, ArrowRight, Building, MapPin, User, FileText, CheckSquare, Square } from 'lucide-react';
import { ProjectInfo } from '../types/ecs';

interface ProjectPageProps {
  projectInfo: ProjectInfo;
  isNewProject: boolean;
  onUpdateField: (field: keyof ProjectInfo, value: any) => void;
  onSaveProject: () => void;
  onStartDesign: () => void;
}

const DESIGN_FIELD_OPTIONS = [
  { id: 'water', label: 'Nước cấp' },
  { id: 'wastewater', label: 'Nước thải' },
  { id: 'air', label: 'Khí thải' },
  { id: 'solidwaste', label: 'Chất thải rắn' },
];

export const ProjectPage: React.FC<ProjectPageProps> = ({
  projectInfo,
  isNewProject,
  onUpdateField,
  onSaveProject,
  onStartDesign,
}) => {
  const toggleDesignField = (id: string) => {
    const current = projectInfo.designFields || [];
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onUpdateField('designFields', updated);
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 py-8 pb-20 animate-fadeIn">
      <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
        {/* Head */}
        <div className="px-6 py-4 border-b border-[#e5ece8] bg-[#fbfdfb] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-[#183b2b]">Thông tin dự án</h1>
            <p className="text-xs text-[#607468]">
              Nhập trực tiếp thông tin tổng quan của công trình kỹ thuật môi trường
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8f3ec] text-[#176b45] border border-[#c6dbcd] self-start sm:self-auto">
            {isNewProject ? 'Tạo dự án mới' : 'Hồ sơ dự án hiện hành'}
          </span>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên dự án */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#234333]">
                Tên dự án / Công trình <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectInfo.name}
                onChange={(e) => onUpdateField('name', e.target.value)}
                placeholder="VD: Trạm xử lý nước thải sinh hoạt Khu đô thị Sunrise"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-sm font-semibold text-[#183929] bg-[#fbfdfb]"
              />
            </div>

            {/* Chủ đầu tư */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3b5245]">
                Chủ đầu tư / Đơn vị quản lý
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={projectInfo.owner}
                  onChange={(e) => onUpdateField('owner', e.target.value)}
                  placeholder="VD: Công ty Cổ phần Phát triển Đô thị ABC"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-xs text-[#183929]"
                />
              </div>
            </div>

            {/* Người liên hệ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3b5245]">
                Người liên hệ / Phụ trách kỹ thuật
              </label>
              <input
                type="text"
                value={projectInfo.contact}
                onChange={(e) => onUpdateField('contact', e.target.value)}
                placeholder="Họ tên, SĐT hoặc Email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-xs text-[#183929]"
              />
            </div>

            {/* Địa điểm xây dựng */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3b5245]">
                Địa điểm xây dựng
              </label>
              <input
                type="text"
                value={projectInfo.location}
                onChange={(e) => onUpdateField('location', e.target.value)}
                placeholder="Xã/Phường, Huyện/Quận, Tỉnh/Thành phố"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-xs text-[#183929]"
              />
            </div>

            {/* Đơn vị thiết kế */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#3b5245]">
                Đơn vị thiết kế
              </label>
              <input
                type="text"
                value={projectInfo.designCompany}
                onChange={(e) => onUpdateField('designCompany', e.target.value)}
                placeholder="Nhập tên công ty / viện thiết kế"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-xs text-[#183929]"
              />
            </div>

            {/* Địa chỉ đơn vị thiết kế */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-[#3b5245]">
                Địa chỉ đơn vị thiết kế
              </label>
              <input
                type="text"
                value={projectInfo.designCompanyAddress}
                onChange={(e) => onUpdateField('designCompanyAddress', e.target.value)}
                placeholder="Địa chỉ trụ sở đơn vị thiết kế"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-xs text-[#183929]"
              />
            </div>

            {/* Lĩnh vực thiết kế */}
            <div className="space-y-2 md:col-span-2 pt-2">
              <label className="block text-xs font-bold text-[#234333]">
                Lĩnh vực thiết kế áp dụng
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DESIGN_FIELD_OPTIONS.map((opt) => {
                  const checked = (projectInfo.designFields || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleDesignField(opt.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                        checked
                          ? 'border-[#176b45] bg-[#e7f3ec] text-[#176b45] shadow-xs'
                          : 'border-[#d4e0d8] bg-[#fbfdfb] text-[#42594b] hover:bg-[#f2f7f4]'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#176b45] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#9ab0a2] shrink-0" />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mô tả / Ghi chú */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-[#3b5245]">
                Mô tả / Ghi chú dự án
              </label>
              <textarea
                rows={3}
                value={projectInfo.description}
                onChange={(e) => onUpdateField('description', e.target.value)}
                placeholder="Phạm vi công việc, yêu cầu chất lượng nước sau xử lý (QCVN 14, QCVN 40 cột A/B), điều kiện mặt bằng thi công..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 text-xs text-[#183929] bg-white resize-y"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#e6eee9]">
            <button
              type="button"
              onClick={onStartDesign}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-[#cbd9d0] bg-[#f4f8f5] text-[#244f37] text-xs font-semibold hover:bg-[#eaf3ed] transition-colors"
            >
              <span>Bắt đầu thiết kế</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onSaveProject}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#176b45] text-white text-xs font-bold hover:bg-[#105a39] shadow-sm transition-all transform hover:-translate-y-0.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu dự án</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
