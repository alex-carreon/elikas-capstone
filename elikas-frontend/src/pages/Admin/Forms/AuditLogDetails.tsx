import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import FormLayout from "./FormLayout";
import TextField from "@/components/TextField";
import api from "@/api";
import FormSkeleton from "@/pages/Skeletons/FormSkeleton";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import colors from "@/constants/colors";
import { toZonedTime, format } from "date-fns-tz";
import { Separator } from "@/components/ui/separator";

type LogDetails = {
  id: number;
  logId: string;
  userType: string;
  userName: string;
  activity: string;
  table: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  actionDate: string;
};

function AuditLogDetails() {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<LogDetails>();

  const { id } = useParams();

  const convertDateTime = (utcString: string) => {
    if (!details?.actionDate) return "";
    const zoned = toZonedTime(new Date(utcString), "Asia/Manila");
    return format(zoned, "MMM d, yyyy h:mm a");
  };

  const getLogDetails = async (signal?: AbortSignal) => {
    try {
      const response = await api.get(`/admin/audit-logs/${id}`, { signal });
      setDetails(response.data.data);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        return;
      }
      console.log(err.response?.data);
    }
  };

  const getAll = async () => {
    const controller = new AbortController();

    try {
      setLoading(true);
      await getLogDetails(controller.signal);
    } catch (err: any) {
      if (err.name === "CanceledError") {
        setLoading(false);
        return;
      }
      console.log(err.response?.data);
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
    getAll();
  }, []);

  return (
    <FormLayout formTitle="Log Details">
      {loading ? (
        <div className="w-full h-full flex flex-col items-center p-12 mt-8 mb-2 gap-4">
          <FormSkeleton />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <TextField
            label="ID"
            id="Admin_AuditLogDetailsId"
            inputType="text"
            value={String(details?.id)}
            readonly
          />
          <TextField
            label="Log ID"
            id="Admin_AuditLogDetailsLogId"
            inputType="text"
            value={String(details?.logId)}
            readonly
          />
          <TextField
            label="User"
            id="Admin_AuditLogDetailsUser"
            inputType="text"
            value={String(details?.userName)}
            readonly
          />
          <TextField
            label="User type"
            id="Admin_AuditLogDetailsUserType"
            inputType="text"
            value={String(details?.userType)}
            readonly
          />
          <TextField
            label="Activity"
            id="Admin_AuditLogDetailsActivity"
            inputType="text"
            value={String(details?.activity)}
            readonly
          />
          <TextField
            label="Table"
            id="Admin_AuditLogDetailsTable"
            inputType="text"
            value={String(details?.table)}
            readonly
          />
          <Separator />
          <Field>
            <FieldLabel>Old Values</FieldLabel>
            <div className="grid grid-cols-2">
              {Object.entries(details?.oldValues ?? {}).map(([key, value]) => {
                return (
                  <>
                    <TextField
                      label={key}
                      id={`Admin_AuditLogDetailsOld${key}`}
                      inputType="text"
                      value={String(value)}
                      readonly
                    />
                  </>
                );
              })}
            </div>
          </Field>
          <Separator />
          <Field>
            <FieldLabel>New Values</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(details?.newValues ?? {}).map(([key, value]) => {
                return (
                  <>
                    <TextField
                      label={key}
                      id={`Admin_AuditLogDetailsNew${key}`}
                      inputType="text"
                      value={String(value)}
                      readonly
                    />
                  </>
                );
              })}
            </div>
          </Field>
          <Separator />
          <TextField
            label="IP Address"
            id="Admin_AuditLogDetailsIP"
            inputType="text"
            value={String(details?.ipAddress)}
            readonly
          />
          <Field>
            <FieldLabel style={{ color: colors.label }}>User Agend</FieldLabel>
            <Textarea
              id="Admin_AuditLogDetailsUserAgent"
              value={String(details?.userAgent)}
              readOnly
            />
          </Field>
          <TextField
            label="Action Date"
            id="Admin_AuditLogDetailsDate"
            inputType="text"
            value={convertDateTime(details?.actionDate ?? "")}
            readonly
          />
        </div>
      )}
    </FormLayout>
  );
}

export default AuditLogDetails;
