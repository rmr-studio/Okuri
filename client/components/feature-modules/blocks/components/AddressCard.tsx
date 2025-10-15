import { Address } from "@/lib/interfaces/common.interface";
import { FC } from "react";

interface Props {
    address: Address;
}

export const AddressCard: FC<Props> = ({ address }) => {
    const { street, city, state } = address;
    return (
        <div>
            <h2>Address</h2>
            <p>{street}</p>
            <p>{city}</p>
            <p>{state}</p>
        </div>
    );
};
