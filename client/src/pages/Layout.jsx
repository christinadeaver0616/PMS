import { useState, useEffect, useMemo, useRef } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { CreateOrganization, SignIn, useAuth, useOrganizationList, useUser } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkspaces, setWorkspaces, setCurrentWorkspace } from '../features/workspaceSlice'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
import api from '../configs/api'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [syncAttempts, setSyncAttempts] = useState(0)
    const [orgsWaitTimedOut, setOrgsWaitTimedOut] = useState(false)
    const syncingRef = useRef(false)
    const { user, isLoaded } = useUser()
    const { workspaces, loading } = useSelector((state) => state.workspace)
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    const { isLoaded: orgsLoaded, userMemberships, setActive } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    })

    const clerkOrgCount = userMemberships?.data?.length ?? 0
    const membershipsReady = orgsLoaded && userMemberships?.isLoading !== true

    const missingMemberships = useMemo(() => {
        if (!membershipsReady || !userMemberships?.data) return []
        const known = new Set(workspaces.map((w) => w.id))
        return userMemberships.data.filter((m) => m?.organization?.id && !known.has(m.organization.id))
    }, [membershipsReady, userMemberships?.data, workspaces])

    const waitingForFirstWorkspace = membershipsReady && clerkOrgCount > 0 && workspaces.length === 0
    const hasMissingWorkspaces = missingMemberships.length > 0
    const syncTimedOut = waitingForFirstWorkspace && syncAttempts >= 10

    const ensureOrg = async (org) => {
        if (!org?.id) return
        const token = await getToken()
        await api.post(
            '/api/workspaces/ensure',
            {
                id: org.id,
                name: org.name,
                slug: org.slug,
                image_url: org.imageUrl || "",
                user: {
                    email: user?.primaryEmailAddress?.emailAddress,
                    name: user?.fullName,
                    image: user?.imageUrl,
                },
            },
            { headers: { Authorization: `Bearer ${token}` } },
        )
    }

    // Initial load of theme
    useEffect(() => {
        dispatch(loadTheme())
    }, [dispatch])

    // After create/upload, Clerk image URL can arrive late — pull it into our DB
    useEffect(() => {
        if (!membershipsReady || !userMemberships?.data?.length || workspaces.length === 0) return

        let cancelled = false

        const refreshImagesFromClerk = async () => {
            let changed = false
            for (const membership of userMemberships.data) {
                const org = membership?.organization
                if (!org?.id || !org.imageUrl) continue
                const ws = workspaces.find((w) => w.id === org.id)
                if (!ws) continue
                const isDefault = !ws.image_url || ws.image_url === "/team2.png"
                if (isDefault || ws.image_url !== org.imageUrl) {
                    try {
                        await ensureOrg(org)
                        changed = true
                    } catch (error) {
                        console.log(error?.response?.data?.message || error.message)
                    }
                }
            }
            if (changed && !cancelled) {
                dispatch(fetchWorkspaces({ getToken }))
            }
        }

        const t1 = setTimeout(refreshImagesFromClerk, 1200)
        const t2 = setTimeout(refreshImagesFromClerk, 3500)
        return () => {
            cancelled = true
            clearTimeout(t1)
            clearTimeout(t2)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membershipsReady, clerkOrgCount, workspaces.length, userMemberships?.data])

    // Do not block forever if Organizations are off or Clerk org list never finishes
    useEffect(() => {
        if (!isLoaded || !user || orgsLoaded) {
            setOrgsWaitTimedOut(false)
            return
        }
        const timer = setTimeout(() => setOrgsWaitTimedOut(true), 8000)
        return () => clearTimeout(timer)
    }, [isLoaded, user, orgsLoaded])

    // Deleted all Clerk orgs — clear stale DB-backed Redux/localStorage so UI is not blank/orphan
    useEffect(() => {
        if (!membershipsReady || clerkOrgCount > 0) return
        localStorage.removeItem('currentWorkspaceId')
        dispatch(setWorkspaces([]))
        setSyncAttempts(0)
    }, [membershipsReady, clerkOrgCount, dispatch])

    // Load workspaces when Clerk has orgs
    useEffect(() => {
        if (isLoaded && user && membershipsReady && clerkOrgCount > 0 && workspaces.length === 0) {
            dispatch(fetchWorkspaces({ getToken }))
        }
    }, [user, isLoaded, membershipsReady, clerkOrgCount, workspaces.length, dispatch, getToken])

    // Sync every Clerk org that is missing from our DB/Redux list
    // Covers first workspace AND creating additional organizations
    useEffect(() => {
        if (!membershipsReady || missingMemberships.length === 0 || syncTimedOut) return
        if (syncingRef.current) return

        let cancelled = false

        const syncMissing = async () => {
            syncingRef.current = true
            try {
                for (const membership of missingMemberships) {
                    const org = membership.organization
                    try {
                        await setActive?.({ organization: org.id })
                        await ensureOrg(org)
                    } catch (error) {
                        console.log(error?.response?.data?.message || error.message)
                    }
                }
                if (!cancelled) {
                    setSyncAttempts((n) => n + 1)
                    await dispatch(fetchWorkspaces({ getToken }))
                    // Prefer the newest missing org as current after create
                    const newest = missingMemberships[missingMemberships.length - 1]?.organization?.id
                    if (newest) {
                        dispatch(setCurrentWorkspace(newest))
                        localStorage.setItem('currentWorkspaceId', newest)
                    }
                }
            } finally {
                syncingRef.current = false
            }
        }

        syncMissing()
        const interval = setInterval(() => {
            if (!cancelled && missingMemberships.length > 0) syncMissing()
        }, 3000)

        return () => {
            cancelled = true
            clearInterval(interval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membershipsReady, missingMemberships.length, syncTimedOut, clerkOrgCount])

    // Wait for Clerk user only. Do not wait on orgs before Sign In.
    if (!isLoaded) {
        return (
            <div className='flex flex-col items-center justify-center gap-3 h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">Loading your account…</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
                <SignIn />
            </div>
        )
    }

    if (!orgsLoaded && orgsWaitTimedOut) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center gap-3 bg-white dark:bg-zinc-950 p-6">
                <p className="text-sm text-gray-600 dark:text-zinc-300 text-center max-w-md">
                    Clerk is signed in, but workspaces did not load. In the Clerk dashboard, turn on Organizations for this app, then refresh this page.
                </p>
                <button
                    type="button"
                    className="text-sm px-4 py-2 rounded bg-blue-600 text-white"
                    onClick={() => window.location.reload()}
                >
                    Refresh
                </button>
            </div>
        )
    }

    // Membership list still hydrating after login / org delete
    if (!membershipsReady) {
        return (
            <div className='flex flex-col items-center justify-center gap-3 h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">Checking your workspaces…</p>
            </div>
        )
    }

    // No Clerk organization left — always show create form first
    if (clerkOrgCount === 0) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-white dark:bg-zinc-950 p-6">
                <p className="text-sm text-gray-600 dark:text-zinc-300 text-center max-w-md">
                    You have no workspace yet. Create an organization to continue.
                </p>
                <CreateOrganization afterCreateOrganizationUrl="/" skipInvitationScreen />
            </div>
        )
    }

    if (syncTimedOut) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center gap-4 bg-white dark:bg-zinc-950 p-6">
                <p className="text-sm text-gray-600 dark:text-zinc-300 text-center max-w-md">
                    We could not finish setting up your workspace. Create a new organization or refresh and try again.
                </p>
                <button
                    type="button"
                    className="text-sm px-4 py-2 rounded bg-blue-600 text-white"
                    onClick={() => {
                        setSyncAttempts(0)
                        dispatch(fetchWorkspaces({ getToken }))
                    }}
                >
                    Try again
                </button>
                <CreateOrganization afterCreateOrganizationUrl="/" skipInvitationScreen />
            </div>
        )
    }

    if (loading || waitingForFirstWorkspace || (hasMissingWorkspaces && workspaces.length === 0)) {
        return (
            <div className='flex flex-col items-center justify-center gap-3 h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">Setting up your workspace…</p>
            </div>
        )
    }

    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col h-screen">
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    {hasMissingWorkspaces && (
                        <div className="mb-4 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded px-3 py-2">
                            Syncing new workspace…
                        </div>
                    )}
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout
