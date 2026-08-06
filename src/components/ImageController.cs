using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using MyMvcApp.Data;

namespace MyMvcApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        private readonly DatasstliContext _context;
        private readonly IWebHostEnvironment _environment;

        public ImageController(DatasstliContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // رفع صورة المستخدم
        [HttpPost("UploadUserImage")]
        public async Task<IActionResult> UploadUserImage()
        {
            try
            {
                var file = Request.Form.Files["file"];
                var userGuid = Request.Form["userGuid"].ToString();

                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "لم يتم اختيار ملف" });

                if (string.IsNullOrEmpty(userGuid))
                    return BadRequest(new { message = "معرف المستخدم مطلوب" });

                // التحقق من صحة الملف
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                var fileExtension = Path.GetExtension(file.FileName).ToLower();

                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest(new { message = "نوع الملف غير مسموح به. المسموح: JPG, JPEG, PNG, GIF" });

                if (file.Length > 5 * 1024 * 1024) // 5MB كحد أقصى
                    return BadRequest(new { message = "حجم الملف يجب أن يكون أقل من 5MB" });

                // المسار الأساسي للتخزين
                var basePath = @"E:\users";
                
                // إنشاء المسار إذا لم يكن موجوداً
                if (!Directory.Exists(basePath))
                    Directory.CreateDirectory(basePath);

                // اسم الملف الجديد
                var fileName = $"{userGuid}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(basePath, fileName);

                // حفظ الملف
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // حفظ معلومات الصورة في قاعدة البيانات
                var existingImage = await _context.UserImages
                    .FirstOrDefaultAsync(img => img.UserGuid == userGuid);

                if (existingImage != null)
                {
                    // حذف الملف القديم
                    if (System.IO.File.Exists(existingImage.FilePath))
                    {
                        System.IO.File.Delete(existingImage.FilePath);
                    }

                    // تحديث الصورة الحالية
                    existingImage.FileName = fileName;
                    existingImage.FilePath = filePath;
                    existingImage.OriginalName = file.FileName;
                    existingImage.UploadDate = DateTime.Now;
                    existingImage.FileSize = file.Length;
                    existingImage.ContentType = file.ContentType;
                }
                else
                {
                    // إضافة صورة جديدة
                    var userImage = new UserImage
                    {
                        UserGuid = userGuid,
                        FileName = fileName,
                        FilePath = filePath,
                        OriginalName = file.FileName,
                        UploadDate = DateTime.Now,
                        FileSize = file.Length,
                        ContentType = file.ContentType
                    };
                    _context.UserImages.Add(userImage);
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = "تم رفع الصورة بنجاح", fileName });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء رفع الصورة", error = ex.Message });
            }
        }

        // جلب صورة المستخدم
        [HttpGet("GetUserImage")]
        public async Task<IActionResult> GetUserImage([FromQuery] string userGuid)
        {
            try
            {
                if (string.IsNullOrEmpty(userGuid))
                    return BadRequest(new { message = "معرف المستخدم مطلوب" });

                var userImage = await _context.UserImages
                    .FirstOrDefaultAsync(img => img.UserGuid == userGuid);

                if (userImage == null || !System.IO.File.Exists(userImage.FilePath))
                    return NotFound(new { message = "الصورة غير موجودة" });

                var imageBytes = await System.IO.File.ReadAllBytesAsync(userImage.FilePath);
                
                return File(imageBytes, userImage.ContentType ?? "image/jpeg");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء جلب الصورة", error = ex.Message });
            }
        }

        // حذف صورة المستخدم
        [HttpDelete("DeleteUserImage")]
        public async Task<IActionResult> DeleteUserImage([FromQuery] string userGuid)
        {
            try
            {
                if (string.IsNullOrEmpty(userGuid))
                    return BadRequest(new { message = "معرف المستخدم مطلوب" });

                var userImage = await _context.UserImages
                    .FirstOrDefaultAsync(img => img.UserGuid == userGuid);

                if (userImage == null)
                    return NotFound(new { message = "الصورة غير موجودة" });

                // حذف الملف من الخادم
                if (System.IO.File.Exists(userImage.FilePath))
                {
                    System.IO.File.Delete(userImage.FilePath);
                }

                // حذف السجل من قاعدة البيانات
                _context.UserImages.Remove(userImage);
                await _context.SaveChangesAsync();

                return Ok(new { message = "تم حذف الصورة بنجاح" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء حذف الصورة", error = ex.Message });
            }
        }

        // التحقق من وجود صورة للمستخدم
        [HttpGet("CheckUserImage")]
        public async Task<IActionResult> CheckUserImage([FromQuery] string userGuid)
        {
            try
            {
                if (string.IsNullOrEmpty(userGuid))
                    return BadRequest(new { message = "معرف المستخدم مطلوب" });

                var userImage = await _context.UserImages
                    .FirstOrDefaultAsync(img => img.UserGuid == userGuid);

                var imageExists = userImage != null && System.IO.File.Exists(userImage.FilePath);

                return Ok(new { 
                    hasImage = imageExists,
                    fileName = imageExists ? userImage.FileName : null,
                    uploadDate = imageExists ? userImage.UploadDate : null
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "حدث خطأ أثناء التحقق من الصورة", error = ex.Message });
            }
        }
    }
}