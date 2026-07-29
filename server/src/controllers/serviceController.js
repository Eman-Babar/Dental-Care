import prisma from '../config/prisma.js';
import { writeAuditLog } from '../utils/auditLog.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Public
export const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isGlobal: true },
      orderBy: { title: 'asc' },
    });
    return res.json({ services });
  } catch (error) {
    console.error('Get all services error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Get a single service
// @route   GET /api/services/:id
// @access  Public
export const getServiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    return res.json({ service });
  } catch (error) {
    console.error('Get service by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private (ADMIN)
export const createService = async (req, res) => {
  const { title, description, duration, price, image: imageUrl } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : imageUrl || '';

  try {
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const service = await prisma.service.create({
      data: {
        title,
        description,
        image: image || null,
        duration: duration ? Number(duration) : null,
        price: price ? Number(price) : null,
      },
    });

    await writeAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: "SERVICE_CREATED",
      entity: "Service",
      entityId: service.id,
      details: `Created service: ${service.title}`,
    });

    return res.status(201).json({
      message: 'Service created successfully',
      service,
    });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Update an existing service
// @route   PUT /api/services/:id
// @access  Private (ADMIN)
export const updateService = async (req, res) => {
  const { id } = req.params;
  const { title, description, duration, price } = req.body;
  
  try {
    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration ? Number(duration) : null;
    if (price !== undefined) updateData.price = price ? Number(price) : null;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      updateData.image = req.body.image || null;
    }

    const updatedService = await prisma.service.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    await writeAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: "SERVICE_UPDATED",
      entity: "Service",
      entityId: updatedService.id,
      details: `Updated service: ${updatedService.title}`,
    });

    return res.json({
      message: 'Service updated successfully',
      service: updatedService,
    });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (ADMIN)
export const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    await prisma.service.delete({
      where: { id: parseInt(id, 10) },
    });

    await writeAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      action: "SERVICE_DELETED",
      entity: "Service",
      entityId: id,
      details: `Deleted service: ${existingService.title}`,
    });

    return res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
