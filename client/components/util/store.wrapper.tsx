import { FCWC, Propless } from "@/lib/interfaces/interface";

const StoreProviderWrapper: FCWC<Propless> = ({ children }) => {
    return <>{children}</>;
};

export default StoreProviderWrapper;
