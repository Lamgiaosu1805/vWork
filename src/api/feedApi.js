import api from './axiosInstance';

const feedApi = {
    getPosts: (params) =>
        api.get('/posts', { params, requiresAuth: true }),

    createPost: (formData) =>
        api.post('/posts', formData, {
            requiresAuth: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    editPost: (postId, formData) =>
        api.patch(`/posts/${postId}/edit`, formData, {
            requiresAuth: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
        
    reactPost: (postId, type) =>
        api.post(`/posts/${postId}/react`, { type }, { requiresAuth: true }),

    deletePost: (postId) =>
        api.delete(`/posts/${postId}`, { requiresAuth: true }),

    pinPost: (postId) =>
        api.patch(`/posts/${postId}/pin`, {}, { requiresAuth: true }),

    getComments: (postId, params) =>
        api.get(`/posts/${postId}/comments`, { params, requiresAuth: true }),


    createComment: (postId, content) =>
        api.post(`/posts/${postId}/comments`, { content }, { requiresAuth: true }),

    createCommentWithImage: (postId, { content, imageUri }) => {
        const formData = new FormData();
        if (content) formData.append('content', content);
        formData.append('image', {
            uri: imageUri,
            name: imageUri.split('/').pop() || 'comment.jpg',
            type: 'image/jpeg',
        });
        return api.post(`/posts/${postId}/comments`, formData, {
            requiresAuth: true,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deleteComment: (postId, commentId) =>
        api.delete(`/posts/${postId}/comments/${commentId}`, { requiresAuth: true }),
};

export default feedApi;
