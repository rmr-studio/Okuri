import { FCWC, Propless } from "@/lib/interfaces/interface";
import { OrganisationsStoreProvider } from "../provider/OrganisationContent";

const StoreProviderWrapper: FCWC<Propless> = ({ children }) => {
    return (
        <>
            <OrganisationsStoreProvider>{children}</OrganisationsStoreProvider>
        </>
    );
};

export default StoreProviderWrapper;
