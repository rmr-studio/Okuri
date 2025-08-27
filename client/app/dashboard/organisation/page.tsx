import OrganisationPicker from "@/components/feature-modules/organisation/dashboard/OrganisationPicker";

const UserOrganisations = () => {
    return (
        <div className="w-full h-full m-6 md:m-12 lg:m-16">
            <h1 className="text-xl text-content">Your Organisations</h1>
            <OrganisationPicker />
        </div>
    );
};

export default UserOrganisations;
