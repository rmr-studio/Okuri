import { FC } from "react";
import { useEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";

/**
 * This component will set up the Gridstack instance with action handlers in order to hook into grid changes and make
 * appropriate actions to the environment to reflect those changes.
 * @param param0
 * @returns
 */
export const BlockEnvironmentGridSync: FC = () => {
    useEnvironmentGridSync(null);
    return null;
};
