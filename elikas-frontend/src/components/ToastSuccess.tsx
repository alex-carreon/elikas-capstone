import colors from "@/constants/colors";
import { toast as sonnerToast } from "sonner";

interface ToastProps {
  id: string | number;
  title: string;
  description?: string;
  button?: {
    label: string;
    onClick: () => void;
  };
}

function Toast(props: ToastProps) {
  const { title, description } = props;

  return (
    <div className="flex rounded-lg bg-[#FFF1DD] shadow-lg ring-1 ring-black/5 w-full md:max-w-[364px] items-center p-4">
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <p className="text-sm font-medium" style={{ color: colors.heading }}>
            {title}
          </p>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

function toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast id={id} title={toast.title} description={toast.description} />
  ));
}

export function EmailToast() {
  return toast({
    title: "Email sent!",
  });
}
