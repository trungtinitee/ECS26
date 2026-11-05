import React from 'react';
import {
  Plus,
  Upload,
  FolderOpen,
  Download,
  Trash2,
  Droplets,
  Recycle,
  Wind,
  Layers,
  Calendar,
  MapPin,
  Building,
  Activity,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { ProjectSnapshot, ActiveDomain } from '../types/ecs';
import { EcsLogoIcon } from './common/EcsLogo';

interface HomePageProps {
  savedProjects: ProjectSnapshot[];
  onNewProject: () => void;
  onImportClick: () => void;
  onOpenProject: (id: string) => void;
  onExportProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onSelectDomain: (domain: ActiveDomain) => void;
  hasActiveProject: boolean;
  activeProjectName?: string;
  onContinueProject?: () => void;
  onOpenProjectDetails?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  savedProjects,
  onNewProject,
  onImportClick,
  onOpenProject,
  onExportProject,
  onDeleteProject,
  onSelectDomain,
  hasActiveProject,
  activeProjectName,
  onContinueProject,
  onOpenProjectDetails,
}) => {
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 pb-20 space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-white via-[#f7faf8] to-[#eaf4ee] border border-[#d2dfd6] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="shrink-0">
          <EcsLogoIcon size={80} className="shadow-lg" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="text-[11px] font-extrabold tracking-widest text-[#176b45] uppercase">
            NỀN TẢNG TÍNH TOÁN KỸ THUẬT MÔI TRƯỜNG
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173827] tracking-tight">
            ECS — Environmental Calculation System
          </h1>
          <p className="text-sm text-[#55695e] leading-relaxed max-w-2xl">
            ECS là hệ thống hỗ trợ kỹ sư môi trường thực hiện các phép tính chuyên ngành,
            tổ chức dữ liệu dự án và từng bước triển khai thiết kế công nghệ.
            Bao gồm bốn phân hệ trọng tâm: Nước cấp, Nước thải, Khí thải và Chất thải rắn.
          </p>
        </div>
      </div>

      {/* Saved Projects Panel */}
      <section className="bg-white border border-[#d5e0d8] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5ede7] bg-[#fbfdfb] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#183b2b]">Dự án đã lưu trên trình duyệt</h2>
            <p className="text-xs text-[#62776c]">
              Chọn một dự án để tiếp tục làm việc trên thiết bị này
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8f2ec] text-[#176b45] border border-[#c6dbcd]">
            {savedProjects.length} dự án
          </span>
        </div>

        <div className="p-5">
          {savedProjects.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#edf5f0] text-[#176b45] flex items-center justify-center">
                <FileCode className="w-7 h-7 opacity-75" />
              </div>
              <div className="font-bold text-sm text-[#20372b]">Chưa có dự án nào được lưu</div>
              <p className="text-xs text-[#6e8075] max-w-md mx-auto leading-relaxed">
                Tạo dự án mới hoặc nhập file JSON để bắt đầu tính toán. Dữ liệu được bảo toàn tự động và lưu trữ an toàn trong trình duyệt của bạn.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNewProject}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#176b45] text-white text-xs font-semibold hover:bg-[#105a39]"
                >
                  <Plus className="w-4 h-4" />
                  Bắt đầu tạo dự án
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedProjects.map((p) => {
                const name = p.project?.name?.trim() || 'Dự án chưa đặt tên';
                const owner = p.project?.owner || 'Chưa nhập chủ đầu tư';
                const location = p.project?.location || 'Chưa nhập địa điểm';
                const cap = p.inputs?.qavg ? `${p.inputs.qavg} m³/ngày` : 'Chưa đặt công suất';
                const unitsCount = p.technology?.units?.length || 0;
                const updatedAt = p.updatedAt || p.savedAt;

                return (
                  <article
                    key={p.id}
                    className="p-4 rounded-xl border border-[#d6e3da] bg-white hover:border-[#8bbd9d] hover:bg-[#fbfdfc] shadow-sm transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-[#e7f3ec] text-[#176b45] flex items-center justify-center font-bold text-sm shrink-0">
                            W
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#1b3d2c] group-hover:text-[#176b45] transition-colors line-clamp-1">
                              {name}
                            </h3>
                            <div className="text-[11px] text-[#63756b] flex items-center gap-1.5 mt-0.5">
                              <Building className="w-3 h-3 text-[#7d9284]" />
                              <span className="truncate">{owner}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold bg-[#eef5f1] text-[#236443] px-2 py-0.5 rounded border border-[#d2e4d8] shrink-0">
                          {cap}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#55695d] pt-1 border-t border-[#f0f4f1]">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-[#7d9284] shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Activity className="w-3 h-3 text-[#7d9284] shrink-0" />
                          <span>{unitsCount} công trình</span>
                        </div>
                      </div>

                      {updatedAt && (
                        <div className="text-[10px] text-[#7d8f84] flex items-center gap-1">
                          <Calendar className="w-3 h-3 opacity-60" />
                          <span>
                            Cập nhật: {new Date(updatedAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#eef3f0]">
                      <button
                        type="button"
                        onClick={() => onOpenProject(p.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#176b45] text-white font-semibold text-xs hover:bg-[#105a39] shadow-xs"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Mở dự án</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onExportProject(p.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-[#c9d8ce] text-[#2a4535] hover:bg-[#f2f7f4]"
                        title="Xuất file JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(p.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-[#ebd2d0] text-[#b42318] hover:bg-[#fff0ef]"
                        title="Xóa dự án"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Engineering Domains: ONLY accessible when an active project is present */}
      {hasActiveProject ? (
        <section className="bg-gradient-to-br from-[#f0f7f3] to-[#e6f1ea] border-2 border-[#176b45] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#176b45] bg-white px-2.5 py-1 rounded-full border border-[#b8dbc3]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#176b45]" />
                Dự án đang làm việc
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#173a28]">
                {activeProjectName || 'Dự án hiện tại'}
              </h2>
              <p className="text-xs text-[#55695e]">
                Chọn phân hệ kỹ thuật hoặc bấm tiếp tục để triển khai tính toán cho dự án này.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenProjectDetails && (
                <button
                  type="button"
                  onClick={onOpenProjectDetails}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#cbd8d0] text-[#204030] text-xs font-semibold hover:bg-[#f5f8f6] transition-colors"
                >
                  Thông tin dự án
                </button>
              )}
              {onContinueProject && (
                <button
                  type="button"
                  onClick={onContinueProject}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176b45] text-white text-xs font-bold hover:bg-[#105a39] shadow-sm transition-all"
                >
                  <span>Tiếp tục thiết kế</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#d1e2d7] space-y-3">
            <div className="text-xs font-bold text-[#183a2a]">
              Phân hệ kỹ thuật của dự án:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* NƯỚC THẢI */}
              <div
                onClick={() => onSelectDomain('wastewater')}
                className="p-4 rounded-xl border border-[#b8d6c2] bg-white hover:border-[#176b45] hover:shadow-md cursor-pointer transition-all space-y-2.5 group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#e5f2e9] text-[#176b45] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Recycle className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#183a2a] group-hover:text-[#176b45]">
                      Nước thải
                    </h3>
                    <span className="text-[9px] bg-[#e5f2e9] text-[#176b45] font-bold px-1.5 py-0.5 rounded">
                      Chính
                    </span>
                  </div>
                  <p className="text-[11px] text-[#62776c] mt-0.5 line-clamp-2 leading-relaxed">
                    Tính tải lượng ô nhiễm, chọn sơ đồ công nghệ và tính chọn thiết bị.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-[#176b45] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Vào phân hệ →
                </div>
              </div>

              {/* NƯỚC CẤP */}
              <div
                onClick={() => onSelectDomain('water')}
                className="p-4 rounded-xl border border-[#d6e0d9] bg-white hover:border-[#176b45] hover:shadow-sm cursor-pointer transition-all space-y-2.5 group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#183a2a] group-hover:text-[#176b45]">
                      Nước cấp
                    </h3>
                    <span className="text-[9px] bg-[#e5f2e9] text-[#176b45] font-bold px-1.5 py-0.5 rounded">
                      Sẵn sàng
                    </span>
                  </div>
                  <p className="text-[11px] text-[#62776c] mt-0.5 line-clamp-2 leading-relaxed">
                    Xử lý nước ngầm/mặt, bể trộn, keo tụ tạo bông, lắng lamen, lọc cát nhanh và khử trùng Clo.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-[#176b45] flex items-center gap-1">
                  Mở thiết kế →
                </div>
              </div>

              {/* KHÍ THẢI */}
              <div
                onClick={() => onSelectDomain('air')}
                className="p-4 rounded-xl border border-[#d6e0d9] bg-white hover:border-[#176b45] hover:shadow-sm cursor-pointer transition-all space-y-2.5 group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#183a2a] group-hover:text-[#176b45]">
                      Khí thải
                    </h3>
                    <span className="text-[9px] bg-[#e5f2e9] text-[#176b45] font-bold px-1.5 py-0.5 rounded">
                      Sẵn sàng
                    </span>
                  </div>
                  <p className="text-[11px] text-[#62776c] mt-0.5 line-clamp-2 leading-relaxed">
                    Chụp hút ACGIH, đường kính ống, quạt ly tâm, tháp đệm hấp thụ Scrubber và lọc bụi túi vải.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-[#176b45] flex items-center gap-1">
                  Mở thiết kế →
                </div>
              </div>

              {/* CHẤT THẢI RẮN */}
              <div
                onClick={() => onSelectDomain('solidwaste')}
                className="p-4 rounded-xl border border-[#d6e0d9] bg-white hover:border-[#176b45] hover:shadow-sm cursor-pointer transition-all space-y-2.5 group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#183a2a] group-hover:text-[#176b45]">
                      Chất thải rắn
                    </h3>
                    <span className="text-[9px] bg-[#e5f2e9] text-[#176b45] font-bold px-1.5 py-0.5 rounded">
                      Sẵn sàng
                    </span>
                  </div>
                  <p className="text-[11px] text-[#62776c] mt-0.5 line-clamp-2 leading-relaxed">
                    Dự báo phát sinh rác thải, ô chôn lấp hợp vệ sinh TCVN 6696, nước rỉ rác và nhà máy compost.
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-[#176b45] flex items-center gap-1">
                  Mở thiết kế →
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Standard Workflow Guide Notice - Shown when No Project is Active */
        <section className="bg-white border border-[#d6e0d8] rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#e5f2e9] text-[#176b45] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-[#183b2b]">
                Quy trình làm việc kỹ thuật trong hệ thống ECS
              </h2>
              <p className="text-xs sm:text-sm text-[#5f7366] leading-relaxed max-w-3xl">
                Để đảm bảo tính nhất quán và lưu trữ chuẩn xác, các phân hệ kỹ thuật môi trường (
                <strong>Nước thải</strong>, <strong>Nước cấp</strong>, <strong>Khí thải</strong>, <strong>Chất thải rắn</strong>
                ) được quản lý đồng bộ theo từng hồ sơ dự án. Hãy <strong>Tạo dự án mới</strong> hoặc <strong>Mở dự án đã lưu</strong> ở danh sách phía trên để bắt đầu tính toán.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-[#e1ece4] bg-[#f9fbf9] space-y-1">
              <div className="text-[11px] font-bold text-[#176b45]">BƯỚC 1</div>
              <div className="text-xs font-bold text-[#1f382a]">Khởi tạo / Mở dự án</div>
              <div className="text-[11px] text-[#6d7f74]">Tạo dự án mới hoặc chọn dự án đã lưu trên máy.</div>
            </div>
            <div className="p-3.5 rounded-xl border border-[#e1ece4] bg-[#f9fbf9] space-y-1">
              <div className="text-[11px] font-bold text-[#176b45]">BƯỚC 2</div>
              <div className="text-xs font-bold text-[#1f382a]">Khai báo dự án</div>
              <div className="text-[11px] text-[#6d7f74]">Khai báo tên công trình, chủ đầu tư & công suất thiết kế.</div>
            </div>
            <div className="p-3.5 rounded-xl border border-[#e1ece4] bg-[#f9fbf9] space-y-1">
              <div className="text-[11px] font-bold text-[#176b45]">BƯỚC 3</div>
              <div className="text-xs font-bold text-[#1f382a]">Chọn phân hệ kỹ thuật</div>
              <div className="text-[11px] text-[#6d7f74]">Chọn phân hệ Nước thải, Nước cấp, Khí thải hoặc CTR.</div>
            </div>
            <div className="p-3.5 rounded-xl border border-[#e1ece4] bg-[#f9fbf9] space-y-1">
              <div className="text-[11px] font-bold text-[#176b45]">BƯỚC 4</div>
              <div className="text-xs font-bold text-[#1f382a]">Tính toán & Thiết bị</div>
              <div className="text-[11px] text-[#6d7f74]">Tính tải lượng, kích thước bể, bảng BOM và xuất báo cáo.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNewProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176b45] text-white font-semibold text-xs hover:bg-[#105a39] shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo dự án mới</span>
            </button>
            <button
              type="button"
              onClick={onImportClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#c4d4c8] text-[#244231] font-semibold text-xs hover:bg-[#f3f8f5] transition-all"
            >
              <Upload className="w-4 h-4 text-[#176b45]" />
              <span>Nhập file dự án JSON</span>
            </button>
          </div>
        </section>
      )}

      {/* Footnote */}
      <div className="text-[11px] text-[#718579] bg-[#f4f7f5] p-3.5 rounded-xl border border-[#d9e5dc] flex items-start gap-2.5">
        <span className="font-bold text-[#176b45]">Ghi chú:</span>
        <p className="leading-relaxed">
          Dữ liệu dự án được lưu tự động trên trình duyệt thiết bị hiện tại (LocalStorage & IndexedDB).
          Khi hoàn thành công việc hoặc chuyển máy, bạn nên dùng chức năng <strong>Xuất JSON</strong> để lưu trữ lâu dài hoặc chia sẻ cho đồng nghiệp.
        </p>
      </div>
    </div>
  );
};
