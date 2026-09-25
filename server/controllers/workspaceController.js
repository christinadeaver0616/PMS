import prisma from "../configs/prisma.js";

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { user: true } } } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });
        res.json({ workspaces });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

async function ensureUserRow(userId, userPayload) {
    const email = userPayload?.email || `${userId}@users.clerk`;
    const displayName = userPayload?.name || "User";
    const image = userPayload?.image || "";

    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail && existingByEmail.id !== userId) {
        await prisma.user.upsert({
            where: { id: userId },
            update: {
                name: displayName,
                image,
            },
            create: {
                id: userId,
                email: `${userId}@users.clerk`,
                name: displayName,
                image,
            },
        });
    } else {
        await prisma.user.upsert({
            where: { id: userId },
            update: {
                email,
                name: displayName,
                image,
            },
            create: {
                id: userId,
                email,
                name: displayName,
                image,
            },
        });
    }

    return prisma.user.findUnique({ where: { id: userId } });
}

// Ensure a Clerk organization exists as a workspace (covers webhook/Inngest lag)
export const ensureWorkspace = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { id, name, slug, image_url, user: userPayload } = req.body;

        if (!id || !name) {
            return res.status(400).json({ message: "Organization id and name are required" });
        }

        const owner = await ensureUserRow(userId, userPayload);
        if (!owner) {
            return res.status(500).json({ message: "Could not create user for workspace owner" });
        }

        const safeSlug = (slug && String(slug).trim()) || id;
        let workspace = await prisma.workspace.findUnique({ where: { id } });

        if (workspace) {
            const nextImage =
                image_url && String(image_url).trim() && image_url !== "/team2.png"
                    ? image_url
                    : undefined;
            workspace = await prisma.workspace.update({
                where: { id },
                data: {
                    name,
                    ...(nextImage ? { image_url: nextImage } : {}),
                },
            });
        } else {
            try {
                workspace = await prisma.workspace.create({
                    data: {
                        id,
                        name,
                        slug: safeSlug,
                        ownerId: userId,
                        image_url: image_url || "/team2.png",
                        members: {
                            create: {
                                userId,
                                role: "ADMIN",
                            },
                        },
                    },
                });
            } catch (error) {
                // Race create or slug clash — fall back to update / unique slug retry
                if (error.code === "P2002") {
                    const slugTaken = await prisma.workspace.findUnique({ where: { slug: safeSlug } });
                    if (slugTaken && slugTaken.id !== id) {
                        workspace = await prisma.workspace.create({
                            data: {
                                id,
                                name,
                                slug: `${safeSlug}-${id.slice(-8)}`,
                                ownerId: userId,
                                image_url: image_url || "/team2.png",
                                members: {
                                    create: {
                                        userId,
                                        role: "ADMIN",
                                    },
                                },
                            },
                        });
                    } else {
                        workspace = await prisma.workspace.findUnique({ where: { id } });
                        if (workspace) {
                            const nextImage =
                                image_url && String(image_url).trim() && image_url !== "/team2.png"
                                    ? image_url
                                    : undefined;
                            workspace = await prisma.workspace.update({
                                where: { id },
                                data: {
                                    name,
                                    ...(nextImage ? { image_url: nextImage } : {}),
                                },
                            });
                        } else {
                            throw error;
                        }
                    }
                } else {
                    throw error;
                }
            }
        }

        await prisma.workspaceMember.upsert({
            where: {
                userId_workspaceId: { userId, workspaceId: id },
            },
            update: {},
            create: {
                userId,
                workspaceId: id,
                role: "ADMIN",
            },
        });

        res.json({ workspace });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
