import { OrganisationPicker } from "@/components/feature-modules/organisation/dashboard/organisation-picker";

const UserOrganisations = () => {
    return (
        <section className=" m-6 md:m-12 lg:m-16">
            <h1 className="text-xl text-content">Your Organisations</h1>
            <OrganisationPicker />
        </section>
    );
};

export default UserOrganisations;
