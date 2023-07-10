const asyncHandler = require('express-async-handler')
const Product = require('../models/productModel')
const cloudinary = require('cloudinary').v2

// Get all products
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ user: req.user._id }).sort('-createdAt')
    res.status(200).json(products)
})

// Create a product
const createProduct = asyncHandler(async (req, res) => {
    const { name, sku, category, quantity, price, description } = req.body

    // Validation
    if(!name || !category || !quantity || !price || !description) {
        res.status(400)
        throw new Error('Please fill in all the fields')
    }
    
    // Handle image upload
    let fileData = {}

    if(req.file) {
        // Save image to cloudinary
        let uploadedFile
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: 'M-ventory app', resource_type: 'image' })
        } catch(error) {
            res.status(500)
            throw new Error('Image could not be uploaded to cloudinary')
        }

        fileData = {
            filename: req.file.originalname,
            filepath: uploadedFile.secure_url,
            filetype: req.file.mimetype,
            filesize: `${(req.file.size / 1000).toFixed(2)} KB`
        }
    }

    // Create product
    const product = await Product.create({
        user: req.user._id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: fileData
    })

    res.status(201).json(product)
})

// Get single product
const getSingleProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)

    // Check if product exists and if not throw error
    if(!product) {
        res.status(404)
        throw new Error('Product not found')
    }

    // Match product to the user
    if(product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }

    res.status(200).json(product)
})

// Delete product
const deleteProduct = asyncHandler(async (req,res) => {
    const product = await Product.findById(req.params.id)

    // Check if product exists and if not throw error
    if(!product) {
        res.status(404)
        throw new Error('Product not found')
    }

    // Check if product is matching the user
    if(product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }

    await product.deleteOne()

    res.status(200).json('Product deleted')
})

// Update product
const updateProduct = asyncHandler(async (req, res) => {
    const { name, category, quantity, price, description } = req.body

    const product = await Product.findById(req.params.id)

    if(!product) {
        res.status(404)
        throw new Error('Product not found')
    }

    if(product.user.toString() !== req.user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }

    // Handle image upload
    let fileData = {}

    if(req.file) {
        let uploadedFile

        // Save image to cloudinary
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, { folder: 'M-ventory app', resource_type: 'image' })
        } catch(error) {
            res.status(500)
            throw new Error('Image could not be uploaded to cloudinary')
        }

        fileData = {
            filename: req.file.originalname,
            filepath: uploadedFile.secure_url,
            filetype: req.file.mimetype,
            filesize: `${(req.file.size / 1000).toFixed(2)} KB`
        }

        // Update product

        const updatedProduct = await Product.findByIdAndUpdate(
            {_id: req.params.id},
            {
                name,
                category,
                quantity,
                price,
                description,
                image: Object.keys(fileData).length === 0 ? product.image : fileData
            },
            {
                new: true,
                runValidators: true
            }
        )

        res.status(200).json(updatedProduct)
    }
})

module.exports = {
    getAllProducts,
    createProduct,
    getSingleProduct,
    deleteProduct,
    updateProduct
}