import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWorkspaces, setCurrentWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";
import { useAuth, useClerk, useOrganizationList, useUser } from "@clerk/clerk-react";
import api from "../configs/api";
import toast from "react-hot-toast";
import { getWorkspaceImage } from "../assets/assets";

function WorkspaceDropdown() {

    const { setActive, userMemberships, isLoaded } = useOrganizationList({
        userMemberships: { infinite: true },
    });

    const { openCreateOrganization } = useClerk()
    const { getToken } = useAuth()
    const { user } = useUser()

    const { workspaces } = useSelector((state) => state.workspace);
    const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace || null);
    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const dropdownRef = useRef(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const orgImage = (url) => getWorkspaceImage(url)

    const ensureOrgInDb = async (organization) => {
        const token = await getToken()
        await api.post(
            "/api/workspaces/ensure",
            {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                image_url: organization.imageUrl || "",
                user: {
                    email: user?.primaryEmailAddress?.emailAddress,
                    name: user?.fullName,
                    image: user?.imageUrl,
                },
            },
            { headers: { Authorization: `Bearer ${token}` } },
        )
    }

    const onSelectWorkspace = async (organization) => {
        if (!organization?.id || switching) return
        setSwitching(true)
        try {
            await setActive({ organization: organization.id })

            const alreadyLoaded = workspaces.some((w) => w.id === organization.id)
            if (!alreadyLoaded) {
                await ensureOrgInDb(organization)
                await dispatch(fetchWorkspaces({ getToken }))
            }

            dispatch(setCurrentWorkspace(organization.id))
            setIsOpen(false)
            navigate("/")
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message || "Could not switch workspace")
        } finally {
            setSwitching(false)
        }
    }

    const onCreateWorkspace = () => {
        setIsOpen(false)
        openCreateOrganization({
            afterCreateOrganizationUrl: "/",
        })
    }

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (currentWorkspace && isLoaded) {
            setActive({ organization: currentWorkspace.id });
        }
    }, [currentWorkspace, isLoaded, setActive]);

    // After creating an org in Clerk, membership list grows — revalidate list if available
    useEffect(() => {
        if (!isLoaded) return
        userMemberships?.revalidate?.()
    }, [isLoaded, workspaces.length])

    return (
        <div className="relative m-4" ref={dropdownRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="w-full flex items-center justify-between p-3 h-auto text-left rounded hover:bg-gray-100 dark:hover:bg-zinc-800" >
                <div className="flex items-center gap-3">
                    <img src={orgImage(currentWorkspace?.image_url)} alt={currentWorkspace?.name} className="w-8 h-8 rounded shadow object-cover" />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">
                            {currentWorkspace?.name || "Select Workspace"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                            {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-zinc-400 flex-shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow-lg top-full left-0">
                    <div className="p-2">
                        <p className="text-xs text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-2">
                            Workspaces
                        </p>
                        {(userMemberships?.data || []).map(({ organization }) => (
                            <div key={organization.id} onClick={() => onSelectWorkspace(organization)} className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-zinc-800" >
                                <img src={orgImage(organization.imageUrl)} alt={organization.name} className="w-6 h-6 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                        {organization.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                        {organization.membersCount || 0} members
                                    </p>
                                </div>
                                {currentWorkspace?.id === organization.id && (
                                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                    <hr className="border-gray-200 dark:border-zinc-700" />

                    <div onClick={onCreateWorkspace} className="p-2 cursor-pointer rounded group hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        <p className="flex items-center text-xs gap-2 my-1 w-full text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300">
                            <Plus className="w-4 h-4" /> Create Workspace
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkspaceDropdown;
