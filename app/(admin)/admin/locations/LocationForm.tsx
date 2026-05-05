import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { upsertLocationAction } from "./actions";

type Loc = {
  id: string;
  name: string;
  address: string;
  floor: string | null;
  capacity: number;
  amenities: string[];
  opensAt: string;
  closesAt: string;
  bufferMinutes: number;
};

export function LocationForm({ location }: { location?: Loc }) {
  const editing = !!location;
  return (
    <form action={upsertLocationAction} className="flex flex-col gap-md">
      {editing && <input type="hidden" name="id" value={location!.id} />}
      <Card step={1} icon="info" title="Thông tin cơ bản">
        <Field label="Tên" required>
          <input name="name" defaultValue={location?.name} required className={inputCls} placeholder="Phòng họp A" />
        </Field>
        <Field label="Địa chỉ" required>
          <input name="address" defaultValue={location?.address} required className={inputCls} placeholder="Tầng 4, Cánh Bắc" />
        </Field>
        <Field label="Tầng">
          <input name="floor" defaultValue={location?.floor ?? ""} className={inputCls} placeholder="Tầng 12" />
        </Field>
      </Card>

      <Card step={2} icon="schedule" title="Sức chứa & giờ hoạt động">
        <div className="grid grid-cols-2 gap-sm">
          <Field label="Sức chứa" required>
            <input type="number" min={1} name="capacity" defaultValue={location?.capacity ?? 4} required className={inputCls} />
          </Field>
          <Field label="Đệm (phút)">
            <input type="number" min={0} name="bufferMinutes" defaultValue={location?.bufferMinutes ?? 0} className={inputCls} />
          </Field>
          <Field label="Giờ mở" required>
            <input type="time" name="opensAt" defaultValue={location?.opensAt ?? "08:00"} required className={inputCls} />
          </Field>
          <Field label="Giờ đóng" required>
            <input type="time" name="closesAt" defaultValue={location?.closesAt ?? "19:00"} required className={inputCls} />
          </Field>
        </div>
      </Card>

      <Card step={3} icon="check_circle" title="Tiện nghi" optional>
        <Field label="Phân cách bằng dấu phẩy" hint="Ví dụ: Video, Máy chiếu, Bảng trắng, Điện thoại">
          <input
            name="amenities"
            defaultValue={(location?.amenities ?? []).join(", ")}
            className={inputCls}
            placeholder="Video, Projector, Whiteboard"
          />
        </Field>
      </Card>

      <div className="flex gap-sm sticky bottom-0 -mx-md md:-mx-lg px-md md:px-lg py-sm bg-surface/95 backdrop-blur-md border-t border-surface-variant">
        <a
          href="/admin/locations"
          className="flex-1 h-12 rounded-lg bg-surface-container text-on-surface font-semibold flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          Hủy
        </a>
        <SubmitButton icon="save" variant="primary" pendingLabel="Đang lưu…" className="flex-[2]">
          {editing ? "Lưu thay đổi" : "Tạo phòng"}
        </SubmitButton>
      </div>
    </form>
  );
}

const inputCls =
  "w-full h-12 px-sm rounded-lg border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface placeholder:text-on-surface-variant/60 transition-colors outline-none";

function Card({
  step,
  icon,
  title,
  optional,
  children,
}: {
  step: number;
  icon: string;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="relative bg-surface border border-surface-variant rounded-xl shadow-soft overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-variant" />
      <div className="p-md flex flex-col gap-sm">
        <div className="flex items-center gap-sm border-b border-surface-variant pb-sm">
          <span className="w-9 h-9 rounded-xl bg-primary-container/60 text-on-primary-container flex items-center justify-center font-bold">
            {step}
          </span>
          <Icon name={icon} className="text-on-surface-variant text-[20px]" />
          <h2 className="font-manrope font-bold text-headline-md text-on-surface">{title}</h2>
          {optional && <span className="text-caption text-on-surface-variant uppercase tracking-wide">Không bắt buộc</span>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-xs">
      <span className="text-label-md uppercase text-on-surface-variant flex items-center gap-xs">
        {label}
        {required && <span className="text-error">*</span>}
      </span>
      {children}
      {hint && <span className="text-caption text-on-surface-variant">{hint}</span>}
    </label>
  );
}
