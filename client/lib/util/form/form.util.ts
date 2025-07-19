import { z } from "zod";

export const MIN_DATE = new Date("1900-01-01");
export const getCurrentDate = () => new Date();

export const OTPFormSchema = z.object({
    otp: z
        .string()
        .length(6, "OTP must be 6 characters long")
        .regex(/^\d+$/, "Must contain only digits"),
});

export type FormOTP = z.infer<typeof OTPFormSchema>;

export const generateDynamicSchema = () => {
    
}